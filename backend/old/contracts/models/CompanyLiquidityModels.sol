// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CompanyLiquidityModels
 * @notice Contains all events, errors, and data structures for the CompanyLiquidityManager contract
 */
contract CompanyLiquidityModels {
  // Custom Errors
  error InvalidPositionIndex();
  error PositionNotActive();
  error InvalidBeneficiariesAmounts();
  error InsufficientAvailableAmount();
  error PayrollNotActive();
  error PayrollNotEnded();
  error AlreadyUnlocked();
  error AlreadyClaimed();
  error NotABeneficiary();
  error NoRewardsToClaim();
  error CannotReduceBelowAvailableAmount();
  error TokenTransferFailed();

  // Events
  event LiquidityPositionAdded(
    address indexed company,
    address indexed pool,
    uint256 indexed positionId,
    uint256 amount0,
    uint256 amount1
  );

  event PayrollCreated(
    uint256 indexed payrollId,
    address indexed company,
    uint256 positionIndex,
    address[] beneficiaries,
    uint256[] amounts,
    uint256 startTime,
    uint256 endTime
  );

  event PayrollClaimed(uint256 indexed payrollId, address indexed beneficiary, uint256 amount);

  event PayrollCancelled(uint256 indexed payrollId, address indexed company);

  event RewardsClaimed(address indexed company, uint256 indexed positionIndex, uint256 amount);

  // Structs
  struct LiquidityPosition {
    address pool;
    uint256 positionId;
    uint256 totalAmount;
    uint256 availableAmount;
    uint256 totalRewards;
    uint256 claimedRewards;
    bool isActive;
  }

  struct PayrollInfo {
    uint256 id;
    uint256 positionIndex;
    uint256 totalAmount;
    uint256 startTime;
    uint256 endTime;
    bool isActive;
  }

  struct BeneficiaryInfo {
    address beneficiary;
    uint256 amount;
    uint256 unlockTime;
    bool hasClaimed;
    uint256 rewardSnapshot;
  }
}
