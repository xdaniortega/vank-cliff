// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract LPTokenMock is ERC20 {
  constructor(
    string memory name,
    string memory symbol,
    address initialHolder,
    uint256 initialSupply
  ) ERC20(name, symbol) {
    _mint(initialHolder, initialSupply);
  }
}