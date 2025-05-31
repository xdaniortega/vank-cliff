// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./mocks/MockLiquidityPool.sol";
import "./interfaces/ILiquidityPool.sol";
import "./models/CompanyLiquidityModels.sol";

/**
 * @title CompanyLiquidityManager
 * @notice Manages liquidity positions and payroll schedules for companies
 */
contract CompanyLiquidityManager is Ownable, CompanyLiquidityModels {
  using SafeERC20 for IERC20;

  // Mapping from company address to their liquidity positions
  mapping(address => LiquidityPosition[]) public companyPositions;

  // Mapping from payroll ID to payroll information
  mapping(uint256 => PayrollInfo) public payrolls;

  // Mapping from company to total number of positions
  mapping(address => uint256) public companyPositionCount;

  // Mappings to store beneficiary data
  mapping(uint256 => address[]) public payrollBeneficiaries; // payrollId => list of beneficiaries
  mapping(uint256 => mapping(address => uint256)) public payrollAmounts; // payrollId => (beneficiary => amount)
  mapping(uint256 => mapping(address => uint256)) public payrollUnlockTimes; // payrollId => (beneficiary => unlock time)
  mapping(uint256 => mapping(address => bool)) public payrollHasClaimed; // payrollId => (beneficiary => has claimed)
  mapping(uint256 => mapping(address => uint256)) public payrollRewardSnapshots; // payrollId => (beneficiary => reward snapshot)

  constructor() Ownable(msg.sender) {}

  /**
   * @dev Add a new liquidity position for a company
   * @param company Address of the company
   * @param pool Address of the liquidity pool
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   */
  function addLiquidityPosition(
    address company,
    address pool,
    uint256 amount0,
    uint256 amount1
  ) external {
    // Transfer tokens from company to this contract
    if (!IERC20(MockLiquidityPool(pool).token0()).transferFrom(company, address(this), amount0)) {
      revert TokenTransferFailed();
    }
    if (!IERC20(MockLiquidityPool(pool).token1()).transferFrom(company, address(this), amount1)) {
      revert TokenTransferFailed();
    }

    // Approve tokens to the pool
    IERC20(MockLiquidityPool(pool).token0()).approve(pool, amount0);
    IERC20(MockLiquidityPool(pool).token1()).approve(pool, amount1);

    // Add liquidity to the pool
    (uint256 positionId_, uint256 liquidity_) = MockLiquidityPool(pool).addLiquidity(
      amount0,
      amount1
    );
    uint256 positionId = positionId_;
    uint256 liquidity = liquidity_;

    uint256 positionIndex = companyPositionCount[company];

    companyPositions[company].push(
      LiquidityPosition({
        pool: pool,
        positionId: positionId,
        totalAmount: liquidity,
        availableAmount: liquidity,
        totalRewards: 0,
        claimedRewards: 0,
        isActive: true
      })
    );

    companyPositionCount[company]++;
  }

  /**
   * @dev Create a new payroll linked to a liquidity position with multiple beneficiaries
   * @param payrollId Unique identifier for the payroll
   * @param company Address of the company
   * @param positionIndex Index of the liquidity position
   * @param beneficiaries List of beneficiary addresses
   * @param amounts List of amounts to pay per beneficiary
   * @param startTime When the payroll starts
   * @param endTime When the payroll ends
   */
  function createPayrollMulti(
    uint256 payrollId,
    address company,
    uint256 positionIndex,
    address[] calldata beneficiaries,
    uint256[] calldata amounts,
    uint256 startTime,
    uint256 endTime
  ) external {
    if (positionIndex >= companyPositionCount[company]) {
      revert InvalidPositionIndex();
    }
    if (!companyPositions[company][positionIndex].isActive) {
      revert PositionNotActive();
    }
    if (beneficiaries.length != amounts.length || beneficiaries.length == 0) {
      revert InvalidBeneficiariesAmounts();
    }

    uint256 total;
    for (uint256 i = 0; i < amounts.length; i++) {
      total += amounts[i];
    }

    if (companyPositions[company][positionIndex].availableAmount < total) {
      revert InsufficientAvailableAmount();
    }
    companyPositions[company][positionIndex].availableAmount -= total;

    // Create payroll info
    payrolls[payrollId] = PayrollInfo({
      id: payrollId,
      positionIndex: positionIndex,
      totalAmount: total,
      startTime: startTime,
      endTime: endTime,
      isActive: true
    });

    // Store beneficiary data
    for (uint256 i = 0; i < beneficiaries.length; i++) {
      payrollBeneficiaries[payrollId].push(beneficiaries[i]);
      payrollAmounts[payrollId][beneficiaries[i]] = amounts[i];
      payrollHasClaimed[payrollId][beneficiaries[i]] = false;
      payrollUnlockTimes[payrollId][beneficiaries[i]] = 0;
      payrollRewardSnapshots[payrollId][beneficiaries[i]] = 0;
    }
  }

  /**
   * @dev Unlock payroll for a beneficiary (can be called by anyone, but only after endTime)
   * @param payrollId ID of the payroll
   * @param beneficiary Address of the beneficiary
   * @param company Address of the company
   */
  function unlockPayrollForBeneficiary(
    uint256 payrollId,
    address beneficiary,
    address company
  ) public {
    PayrollInfo storage payroll = payrolls[payrollId];
    if (!payroll.isActive) {
      revert PayrollNotActive();
    }
    if (block.timestamp < payroll.endTime) {
      revert PayrollNotEnded();
    }
    if (payrollUnlockTimes[payrollId][beneficiary] != 0) {
      revert AlreadyUnlocked();
    }
    uint256 positionIndex = payroll.positionIndex;

    // Snapshot totalRewards at unlock
    payrollUnlockTimes[payrollId][beneficiary] = block.timestamp;
    payrollRewardSnapshots[payrollId][beneficiary] = companyPositions[company][positionIndex]
      .totalRewards;
  }

  /**
   * @dev Claim payroll amount and rewards for a beneficiary
   * @param payrollId ID of the payroll
   * @param company Address of the company
   */
  function claimPayrollAmount(uint256 payrollId, address company) external {
    PayrollInfo storage payroll = payrolls[payrollId];
    if (!payroll.isActive) {
      revert PayrollNotActive();
    }
    if (payrollHasClaimed[payrollId][msg.sender]) {
      revert AlreadyClaimed();
    }

    address beneficiary = msg.sender;
    if (payrollAmounts[payrollId][beneficiary] == 0) {
      revert NotABeneficiary();
    }

    if (payrollUnlockTimes[payrollId][beneficiary] == 0) {
      if (block.timestamp < payroll.endTime) {
        revert PayrollNotEnded();
      }
      unlockPayrollForBeneficiary(payrollId, beneficiary, company);
    }

    uint256 positionIndex = payroll.positionIndex;
    // Calculate rewards: rewards since unlock
    uint256 rewardsAtUnlock = payrollRewardSnapshots[payrollId][beneficiary];
    uint256 rewardsNow = companyPositions[company][positionIndex].totalRewards;
    uint256 totalPayroll = payroll.totalAmount;
    uint256 userShare = payrollAmounts[payrollId][beneficiary];
    uint256 rewardShare = ((rewardsNow - rewardsAtUnlock) * userShare) / totalPayroll;

    // Mark as claimed
    payrollHasClaimed[payrollId][beneficiary] = true;

    // Update available amount in position
    companyPositions[company][positionIndex].availableAmount += userShare;

    // Get pool address from current position
    address pool = companyPositions[company][positionIndex].pool;

    // Add liquidity position for beneficiary with claimed amount
    // Split the claimed amount equally between token0 and token1
    uint256 amount0 = userShare / 2;
    uint256 amount1 = userShare - amount0; // Handle odd amounts

    // Add liquidity position for beneficiary
    uint256 beneficiaryPositionIndex = companyPositionCount[beneficiary];
    companyPositions[beneficiary].push(
      LiquidityPosition({
        pool: pool,
        positionId: 0, // Will be set by addLiquidity
        totalAmount: userShare,
        availableAmount: userShare,
        totalRewards: 0,
        claimedRewards: 0,
        isActive: true
      })
    );

    // Add liquidity to the pool
    (uint256 positionId, uint256 liquidity) = MockLiquidityPool(pool).addLiquidity(
      amount0,
      amount1
    );

    // Update position ID
    companyPositions[beneficiary][beneficiaryPositionIndex].positionId = positionId;
    companyPositions[beneficiary][beneficiaryPositionIndex].totalAmount = liquidity;
    companyPositions[beneficiary][beneficiaryPositionIndex].availableAmount = liquidity;

    companyPositionCount[beneficiary]++;

    // Transfer logic for unlock and rewards (to be implemented as needed)
    emit PayrollClaimed(payrollId, beneficiary, userShare);
    emit RewardsClaimed(beneficiary, positionIndex, rewardShare);
    emit LiquidityPositionAdded(beneficiary, pool, positionId, amount0, amount1);
  }

  /**
   * @dev Claim rewards from a position
   * @param company Address of the company
   * @param positionIndex Index of the position
   */
  function claimRewards(address company, uint256 positionIndex) external {
    if (positionIndex >= companyPositionCount[company]) {
      revert InvalidPositionIndex();
    }
    LiquidityPosition storage position = companyPositions[company][positionIndex];
    if (!position.isActive) {
      revert PositionNotActive();
    }

    uint256 rewards = MockLiquidityPool(position.pool).claimRewards(position.positionId);
    if (rewards == 0) {
      revert NoRewardsToClaim();
    }

    // Update position
    position.totalRewards += rewards;
    position.claimedRewards += rewards;

    emit RewardsClaimed(company, positionIndex, rewards);
  }

  /**
   * @dev Get payroll information
   * @param payrollId ID of the payroll
   * @return positionIndex Index of the linked liquidity position
   * @return amount Amount in payroll
   * @return startTime When the payroll starts
   * @return endTime When the payroll ends
   * @return claimedAmount Amount already claimed
   * @return isActive Whether the payroll is active
   */
  function getPayrollInfo(
    uint256 payrollId
  )
    external
    view
    returns (
      uint256 positionIndex,
      uint256 amount,
      uint256 startTime,
      uint256 endTime,
      uint256 claimedAmount,
      bool isActive
    )
  {
    PayrollInfo storage payroll = payrolls[payrollId];
    return (
      payroll.positionIndex,
      payroll.totalAmount,
      payroll.startTime,
      payroll.endTime,
      payrollRewardSnapshots[payrollId][msg.sender],
      payroll.isActive
    );
  }

  /**
   * @dev Get company position information
   * @param company Address of the company
   * @param positionIndex Index of the position
   * @return pool Address of the pool
   * @return positionId ID in the pool
   * @return totalAmount Total amount in position
   * @return availableAmount Available amount for payroll
   * @return totalRewards Total rewards accumulated
   * @return claimedRewards Rewards already claimed
   * @return isActive Whether the position is active
   */
  function getPositionInfo(
    address company,
    uint256 positionIndex
  )
    external
    view
    returns (
      address pool,
      uint256 positionId,
      uint256 totalAmount,
      uint256 availableAmount,
      uint256 totalRewards,
      uint256 claimedRewards,
      bool isActive
    )
  {
    if (positionIndex >= companyPositionCount[company]) {
      revert InvalidPositionIndex();
    }
    LiquidityPosition memory position = companyPositions[company][positionIndex];
    
    // Calculate real-time rewards from the pool
    uint256 currentRewards = MockLiquidityPool(position.pool)
      .calculateRewards(position.positionId);
    
    return (
      position.pool,
      position.positionId,
      position.totalAmount,
      position.availableAmount,
      position.totalRewards + currentRewards, // Add current rewards
      position.claimedRewards,
      position.isActive
    );
  }

  /**
   * @dev Update a liquidity position's amount
   * @param company Address of the company
   * @param positionIndex Index of the position
   * @param newAmount New total amount
   */
  function updatePositionAmount(
    address company,
    uint256 positionIndex,
    uint256 newAmount
  ) external {
    if (positionIndex >= companyPositionCount[company]) {
      revert InvalidPositionIndex();
    }
    if (!companyPositions[company][positionIndex].isActive) {
      revert PositionNotActive();
    }

    LiquidityPosition storage position = companyPositions[company][positionIndex];
    uint256 oldAmount = position.totalAmount;

    if (newAmount > oldAmount) {
      position.availableAmount += (newAmount - oldAmount);
    } else {
      if (position.availableAmount < (oldAmount - newAmount)) {
        revert CannotReduceBelowAvailableAmount();
      }
      position.availableAmount -= (oldAmount - newAmount);
    }

    position.totalAmount = newAmount;
  }

  /**
   * @dev Cancel a payroll and return the amount to available
   * @param payrollId ID of the payroll to cancel
   * @param company Address of the company
   */
  function cancelPayroll(uint256 payrollId, address company) external onlyOwner {
    if (!payrolls[payrollId].isActive) {
      revert PayrollNotActive();
    }

    PayrollInfo storage payroll = payrolls[payrollId];
    uint256 positionIndex = payroll.positionIndex;
    uint256 remainingAmount = payroll.totalAmount;

    // Return remaining amount to available
    companyPositions[company][positionIndex].availableAmount += remainingAmount;

    // Mark payroll as inactive
    payroll.isActive = false;
  }

  /**
   * @dev Internal function to add liquidity position
   * @param company Address of the company
   * @param pool Address of the liquidity pool
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   * @return positionIndex Index of the created position
   */
  function _addLiquidityPosition(
    address company,
    address pool,
    uint256 amount0,
    uint256 amount1
  ) internal returns (uint256 positionIndex) {
    // Transfer tokens from company to this contract
    if (!IERC20(MockLiquidityPool(pool).token0()).transferFrom(company, address(this), amount0)) {
      revert TokenTransferFailed();
    }
    if (!IERC20(MockLiquidityPool(pool).token1()).transferFrom(company, address(this), amount1)) {
      revert TokenTransferFailed();
    }

    // Approve tokens to the pool
    IERC20(MockLiquidityPool(pool).token0()).approve(pool, amount0);
    IERC20(MockLiquidityPool(pool).token1()).approve(pool, amount1);

    // Add liquidity to the pool
    (uint256 positionId_, uint256 liquidity_) = MockLiquidityPool(pool).addLiquidity(
      amount0,
      amount1
    );
    uint256 positionId = positionId_;
    uint256 liquidity = liquidity_;

    positionIndex = companyPositionCount[company];

    companyPositions[company].push(
      LiquidityPosition({
        pool: pool,
        positionId: positionId,
        totalAmount: liquidity,
        availableAmount: liquidity,
        totalRewards: 0,
        claimedRewards: 0,
        isActive: true
      })
    );

    companyPositionCount[company]++;

    return positionIndex;
  }

  /**
   * @dev Internal function to create payroll
   * @param payrollId Unique identifier for the payroll
   * @param company Address of the company
   * @param positionIndex Index of the liquidity position
   * @param amount Amount to pay
   * @param startTime When the payroll starts
   * @param endTime When the payroll ends
   */
  function _createPayroll(
    uint256 payrollId,
    address company,
    uint256 positionIndex,
    uint256 amount,
    uint256 startTime,
    uint256 endTime
  ) internal {
    if (positionIndex >= companyPositionCount[company]) {
      revert InvalidPositionIndex();
    }
    if (!companyPositions[company][positionIndex].isActive) {
      revert PositionNotActive();
    }
    if (
      companyPositions[company][positionIndex].availableAmount < amount
    ) {
      revert InsufficientAvailableAmount();
    }

    // Update available amount
    companyPositions[company][positionIndex].availableAmount -= amount;

    // Create payroll
    PayrollInfo storage payroll = payrolls[payrollId];
    payroll.positionIndex = positionIndex;
    payroll.totalAmount = amount;
    payroll.startTime = startTime;
    payroll.endTime = endTime;
    payroll.isActive = true;
  }

  /**
   * @dev Add liquidity position and create payroll in a single transaction
   * @param company Address of the company
   * @param pool Address of the liquidity pool
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   * @param payrollId Unique identifier for the payroll
   * @param payrollAmount Amount to pay
   * @param startTime When the payroll starts
   * @param endTime When the payroll ends
   */
  function addLiquidityAndCreatePayroll(
    address company,
    address pool,
    uint256 amount0,
    uint256 amount1,
    uint256 payrollId,
    uint256 payrollAmount,
    uint256 startTime,
    uint256 endTime
  ) external {
    uint256 positionIndex = _addLiquidityPosition(company, pool, amount0, amount1);
    _createPayroll(payrollId, company, positionIndex, payrollAmount, startTime, endTime);
  }
}
