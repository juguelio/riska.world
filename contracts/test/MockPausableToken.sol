// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice Test-only ERC20 that models an ordinary pausable token.
/// @dev `transferFrom` (deposit path) always works, so it can be added as an
///      auxiliary token. `transfer` (settlement/withdraw path) reverts once
///      paused — exactly what a real pausable token does when its issuer pauses
///      it, or what a blocklisting token does to a listed recipient. No malice
///      required.
contract MockPausableToken is ERC20 {
    bool public paused;

    constructor() ERC20("Mock Pausable", "mPAUSE") {
        _mint(msg.sender, 1_000_000e18);
    }

    function setPaused(bool value) external {
        paused = value;
    }

    function transfer(address to, uint256 amount) public override returns (bool) {
        require(!paused, "TOKEN_PAUSED");
        return super.transfer(to, amount);
    }
}
