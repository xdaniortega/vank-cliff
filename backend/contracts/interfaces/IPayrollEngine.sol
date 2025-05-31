// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

interface IPayrollEngine {
  function getAvailablePayroll(address user) external view returns (uint256);
  function getYield(address user) external view returns (uint256);
}
