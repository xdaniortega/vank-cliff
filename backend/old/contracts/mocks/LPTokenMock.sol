// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';

contract StakedTokenMock is ERC20 {
  constructor(
    string memory name,
    string memory symbol,
    address initialHolder,
    uint256 initialSupply
  ) ERC20(name, symbol) {
    _mint(initialHolder, initialSupply);
  }

  function deposit(address token, uint256 amount) public {
    IERC20(token).transferFrom(msg.sender, address(this), amount);
  }

  // It'll retrieve the amount deposited+5%
  function withdraw(address token, uint256 amount) public {
    IERC20(token).transfer(msg.sender, amount);
    _mint(msg.sender, (amount * 105) / 100);
  }
}
