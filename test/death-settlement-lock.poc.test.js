// PoC — a single auxiliary token whose transfer fails permanently bricks the
// entire death settlement, locking the policy's USDC principal forever.
//
// Run:  npx hardhat test --config hardhat.config.cjs test/death-settlement-lock.poc.test.js
// (or add it to the default run via: npm run contracts:test)
//
// Runs on Hardhat's in-process EVM — no external chain and no ganache required,
// though it runs identically against `npx hardhat node` or ganache.
//
// NO attacker and NO malicious contract: an ordinary pausable ERC20 the holder
// puts in custody, whose issuer later pauses it. The identical lock reproduces
// with a USDC-blocklisted beneficiary.

const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const usdc = (amount) => ethers.parseUnits(amount, 6);
const termsHash = ethers.keccak256(ethers.toUtf8Bytes("riska-policy-terms-v2-flexible"));
const PAYMENT_PERIOD = 30 * 24 * 60 * 60;
const DEATH_REPORT_DELAY = 12 * PAYMENT_PERIOD;

async function advance(seconds) {
  await network.provider.send("evm_increaseTime", [seconds]);
  await network.provider.send("evm_mine");
}

describe("PoC — death settlement lock via a failing auxiliary token", function () {
  it("permanently locks 10,800 USDC of principal when one auxiliary token is paused", async function () {
    const [owner, holder, beneficiaryA, beneficiaryB] = await ethers.getSigners();

    // ---- deploy the real system (mirrors the project's own fixture) ----
    const token = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const registry = await (await ethers.getContractFactory("RiskaBeneficiaryRegistry")).deploy();
    const vault = await (await ethers.getContractFactory("RiskaPremiumVault")).deploy(
      await token.getAddress(), await registry.getAddress()
    );
    const manager = await (await ethers.getContractFactory("RiskaPolicyManager")).deploy(
      await registry.getAddress(), await vault.getAddress(), owner.address // verifier = owner
    );
    await registry.connect(owner).setPolicyManager(await manager.getAddress());
    await vault.connect(owner).setPolicyManager(await manager.getAddress());

    // ---- open a policy and fund the 10,800 USDC minimum ----
    await token.mint(holder.address, usdc("10800"));
    await token.connect(holder).approve(await vault.getAddress(), usdc("10800"));

    const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes("poc-holder"));
    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const signature = await owner.signTypedData(
      { name: "RiskaPolicyManager", version: "1", chainId: 31337, verifyingContract: await manager.getAddress() },
      { PolicyHumanAuthorization: [
        { name: "holder", type: "address" }, { name: "nullifierHash", type: "bytes32" }, { name: "deadline", type: "uint256" }
      ] },
      { holder: holder.address, nullifierHash, deadline }
    );
    await manager.connect(holder).openPolicy(
      [beneficiaryA.address, beneficiaryB.address], [6000, 4000],
      termsHash, nullifierHash, deadline, signature
    );
    const opened = await manager.policies(1);
    const toFund = usdc("10800") - opened.remainingMinimumPrincipal;
    if (toFund > 0n) await manager.connect(holder).deposit(1, toFund);

    expect((await manager.policies(1)).remainingMinimumPrincipal).to.equal(usdc("10800"));
    expect(await token.balanceOf(await vault.getAddress())).to.equal(usdc("10800"));

    // ---- holder deposits an ordinary pausable token as an auxiliary asset ----
    const aux = await (await ethers.getContractFactory("MockPausableToken")).deploy(); // minted to owner
    await aux.transfer(holder.address, 1000n);
    await aux.connect(holder).approve(await vault.getAddress(), 1000n);
    await manager.connect(holder).depositToken(1, await aux.getAddress(), 1000n);

    // ---- 12 months pass with no holder interaction; a beneficiary reports death ----
    await advance(DEATH_REPORT_DELAY);
    await manager.connect(beneficiaryA).reportDeath(1);

    // ---- 12 more months pass; the claim window opens ----
    await advance(DEATH_REPORT_DELAY);

    // ---- the token's issuer pauses it (a routine, non-malicious event) ----
    await aux.setPaused(true);

    // ---- THE DEMONSTRATION: claimDeath reverts, and stays reverting forever ----
    await expect(manager.connect(beneficiaryA).claimDeath(1)).to.be.revertedWith("TOKEN_PAUSED");

    // No recovery path exists. The holder is dead, and every rescue function is
    // holder-only. Prove each one is unavailable:
    await expect(manager.connect(beneficiaryA).withdrawToken(1, await aux.getAddress(), 1000n))
      .to.be.revertedWith("ONLY_HOLDER");
    await expect(manager.connect(beneficiaryA).claimAll(1)).to.be.revertedWith("ONLY_HOLDER");
    await expect(manager.connect(beneficiaryA).withdrawExtra(1, 1n)).to.be.revertedWith("ONLY_HOLDER");
    await expect(manager.connect(beneficiaryA).updateBeneficiaries(1, [beneficiaryA.address], [10000]))
      .to.be.revertedWith("ONLY_HOLDER");

    // A retry still fails — this is permanent, not transient.
    await advance(PAYMENT_PERIOD);
    await expect(manager.connect(beneficiaryB).claimDeath(1)).to.be.revertedWith("TOKEN_PAUSED");

    // The 10,800 USDC is still sitting in the vault, unclaimable by anyone.
    expect(await token.balanceOf(await vault.getAddress())).to.equal(usdc("10800"));
    expect(await token.balanceOf(beneficiaryA.address)).to.equal(0n);
    expect(await token.balanceOf(beneficiaryB.address)).to.equal(0n);
  });

  it("control: with a normal auxiliary token the same flow settles and pays the beneficiaries", async function () {
    const [owner, holder, beneficiaryA, beneficiaryB] = await ethers.getSigners();

    const token = await (await ethers.getContractFactory("MockUSDC")).deploy();
    const registry = await (await ethers.getContractFactory("RiskaBeneficiaryRegistry")).deploy();
    const vault = await (await ethers.getContractFactory("RiskaPremiumVault")).deploy(
      await token.getAddress(), await registry.getAddress()
    );
    const manager = await (await ethers.getContractFactory("RiskaPolicyManager")).deploy(
      await registry.getAddress(), await vault.getAddress(), owner.address
    );
    await registry.connect(owner).setPolicyManager(await manager.getAddress());
    await vault.connect(owner).setPolicyManager(await manager.getAddress());

    await token.mint(holder.address, usdc("10800"));
    await token.connect(holder).approve(await vault.getAddress(), usdc("10800"));
    const nullifierHash = ethers.keccak256(ethers.toUtf8Bytes("poc-holder-2"));
    const deadline = (await ethers.provider.getBlock("latest")).timestamp + 3600;
    const signature = await owner.signTypedData(
      { name: "RiskaPolicyManager", version: "1", chainId: 31337, verifyingContract: await manager.getAddress() },
      { PolicyHumanAuthorization: [
        { name: "holder", type: "address" }, { name: "nullifierHash", type: "bytes32" }, { name: "deadline", type: "uint256" }
      ] },
      { holder: holder.address, nullifierHash, deadline }
    );
    await manager.connect(holder).openPolicy(
      [beneficiaryA.address, beneficiaryB.address], [6000, 4000],
      termsHash, nullifierHash, deadline, signature
    );
    const opened = await manager.policies(1);
    const toFund = usdc("10800") - opened.remainingMinimumPrincipal;
    if (toFund > 0n) await manager.connect(holder).deposit(1, toFund);

    const aux = await (await ethers.getContractFactory("MockPausableToken")).deploy();
    await aux.transfer(holder.address, 1000n);
    await aux.connect(holder).approve(await vault.getAddress(), 1000n);
    await manager.connect(holder).depositToken(1, await aux.getAddress(), 1000n);

    await advance(DEATH_REPORT_DELAY);
    await manager.connect(beneficiaryA).reportDeath(1);
    await advance(DEATH_REPORT_DELAY);

    // token NOT paused -> settlement succeeds
    await manager.connect(beneficiaryA).claimDeath(1);

    // death payout = 80% of the 10,800 minimum = 8,640, split 60/40.
    expect(await token.balanceOf(beneficiaryA.address)).to.equal(usdc("5184")); // 8640 * 0.6
    expect(await token.balanceOf(beneficiaryB.address)).to.equal(usdc("3456")); // 8640 * 0.4
  });
});
