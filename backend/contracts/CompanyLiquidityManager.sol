// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import './mocks/MockLiquidityPool.sol';
import './interfaces/ILiquidityPool.sol';
import './models/CompanyLiquidityModels.sol';

/**
 * @title CompanyLiquidityManager
 * @notice Manages liquidity positions and vesting schedules for companies
 */
contract CompanyLiquidityManager is Ownable, CompanyLiquidityModels {
  using SafeERC20 for IERC20;

  // Mapping from company address to their liquidity positions
  mapping(address => LiquidityPosition[]) public companyPositions;

  // Mapping from vesting ID to vesting information
  mapping(uint256 => VestingInfo) public vestings;

  // Mapping from company to total number of positions
  mapping(address => uint256) public companyPositionCount;

  // Mappings to store beneficiary data
  mapping(uint256 => address[]) public vestingBeneficiaries; // vestingId => list of beneficiaries
  mapping(uint256 => mapping(address => uint256)) public vestingAmounts; // vestingId => (beneficiary => amount)
  mapping(uint256 => mapping(address => uint256)) public vestingUnlockTimes; // vestingId => (beneficiary => unlock time)
  mapping(uint256 => mapping(address => bool)) public vestingHasClaimed; // vestingId => (beneficiary => has claimed)
  mapping(uint256 => mapping(address => uint256)) public vestingRewardSnapshots; // vestingId => (beneficiary => reward snapshot)

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
    require(
      IERC20(MockLiquidityPool(pool).token0()).transferFrom(company, address(this), amount0),
      'Token0 transfer failed'
    );
    require(
      IERC20(MockLiquidityPool(pool).token1()).transferFrom(company, address(this), amount1),
      'Token1 transfer failed'
    );

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
   * @dev Create a new vesting linked to a liquidity position with multiple beneficiaries
   * @param vestingId Unique identifier for the vesting
   * @param company Address of the company
   * @param positionIndex Index of the liquidity position
   * @param beneficiaries List of beneficiary addresses
   * @param amounts List of amounts to vest per beneficiary
   * @param startTime When the vesting starts
   * @param endTime When the vesting ends
   */
  function createVestingMulti(
    uint256 vestingId,
    address company,
    uint256 positionIndex,
    address[] calldata beneficiaries,
    uint256[] calldata amounts,
    uint256 startTime,
    uint256 endTime
  ) external {
    require(positionIndex < companyPositionCount[company], 'Invalid position index');
    require(companyPositions[company][positionIndex].isActive, 'Position not active');
    require(
      beneficiaries.length == amounts.length && beneficiaries.length > 0,
      'Invalid beneficiaries/amounts'
    );
    uint256 total;
    for (uint256 i = 0; i < amounts.length; i++) {
      total += amounts[i];
    }
    require(
      companyPositions[company][positionIndex].availableAmount >= total,
      'Insufficient available amount'
    );
    companyPositions[company][positionIndex].availableAmount -= total;

    // Create vesting info
    vestings[vestingId] = VestingInfo({
      id: vestingId,
      positionIndex: positionIndex,
      totalAmount: total,
      startTime: startTime,
      endTime: endTime,
      isActive: true
    });

    // Store beneficiary data
    for (uint256 i = 0; i < beneficiaries.length; i++) {
      vestingBeneficiaries[vestingId].push(beneficiaries[i]);
      vestingAmounts[vestingId][beneficiaries[i]] = amounts[i];
      vestingHasClaimed[vestingId][beneficiaries[i]] = false;
      vestingUnlockTimes[vestingId][beneficiaries[i]] = 0;
      vestingRewardSnapshots[vestingId][beneficiaries[i]] = 0;
    }
  }

  /**
   * @dev Unlock vesting for a beneficiary (can be called by anyone, but only after endTime)
   * @param vestingId ID of the vesting
   * @param beneficiary Address of the beneficiary
   * @param company Address of the company
   */
  function unlockVestingForBeneficiary(
    uint256 vestingId,
    address beneficiary,
    address company
  ) public {
    VestingInfo storage vesting = vestings[vestingId];
    require(vesting.isActive, 'Vesting not active');
    require(block.timestamp >= vesting.endTime, 'Vesting not ended');
    require(vestingUnlockTimes[vestingId][beneficiary] == 0, 'Already unlocked');
    uint256 positionIndex = vesting.positionIndex;

    // Snapshot totalRewards at unlock
    vestingUnlockTimes[vestingId][beneficiary] = block.timestamp;
    vestingRewardSnapshots[vestingId][beneficiary] = companyPositions[company][positionIndex]
      .totalRewards;
  }

  /**
   * @dev Claim vested amount and rewards for a beneficiary
   * @param vestingId ID of the vesting
   * @param company Address of the company
   */
  function claimVestedAmount(uint256 vestingId, address company) external {
    VestingInfo storage vesting = vestings[vestingId];
    require(vesting.isActive, 'Vesting not active');
    require(!vestingHasClaimed[vestingId][msg.sender], 'Already claimed');

    address beneficiary = msg.sender;
    require(vestingAmounts[vestingId][beneficiary] > 0, 'Not a beneficiary');

    if (vestingUnlockTimes[vestingId][beneficiary] == 0) {
      require(block.timestamp >= vesting.endTime, 'Vesting not ended');
      unlockVestingForBeneficiary(vestingId, beneficiary, company);
    }

    uint256 positionIndex = vesting.positionIndex;
    // Calculate rewards: rewards since unlock
    uint256 rewardsAtUnlock = vestingRewardSnapshots[vestingId][beneficiary];
    uint256 rewardsNow = companyPositions[company][positionIndex].totalRewards;
    uint256 totalVesting = vesting.totalAmount;
    uint256 userShare = vestingAmounts[vestingId][beneficiary];
    uint256 rewardShare = ((rewardsNow - rewardsAtUnlock) * userShare) / totalVesting;

    // Mark as claimed
    vestingHasClaimed[vestingId][beneficiary] = true;

    // Update available amount in position
    companyPositions[company][positionIndex].availableAmount += userShare;

    // Transfer logic for unlock and rewards (to be implemented as needed)
    emit VestingClaimed(vestingId, beneficiary, userShare);
    emit RewardsClaimed(beneficiary, positionIndex, rewardShare);
  }

  /**
   * @dev Claim rewards from a position
   * @param company Address of the company
   * @param positionIndex Index of the position
   */
  function claimRewards(address company, uint256 positionIndex) external {
    require(positionIndex < companyPositionCount[company], 'Invalid position index');
    LiquidityPosition storage position = companyPositions[company][positionIndex];
    require(position.isActive, 'Position not active');

    // Claim rewards from the pool
    uint256 rewards = MockLiquidityPool(position.pool).claimRewards(position.positionId);
    require(rewards > 0, 'No rewards to claim');

    // Update position
    position.totalRewards += rewards;
    position.claimedRewards += rewards;

    emit RewardsClaimed(company, positionIndex, rewards);
  }

  /**
   * @dev Get vesting information
   * @param vestingId ID of the vesting
   * @return positionIndex Index of the linked liquidity position
   * @return amount Amount vested
   * @return startTime When the vesting starts
   * @return endTime When the vesting ends
   * @return claimedAmount Amount already claimed
   * @return isActive Whether the vesting is active
   */
  function getVestingInfo(
    uint256 vestingId
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
    VestingInfo storage vesting = vestings[vestingId];
    return (
      vesting.positionIndex,
      vesting.totalAmount,
      vesting.startTime,
      vesting.endTime,
      vestingRewardSnapshots[vestingId][msg.sender],
      vesting.isActive
    );
  }

  /**
   * @dev Get company position information
   * @param company Address of the company
   * @param positionIndex Index of the position
   * @return pool Address of the pool
   * @return positionId ID in the pool
   * @return totalAmount Total amount in position
   * @return availableAmount Available amount for vesting
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
    require(positionIndex < companyPositionCount[company], 'Invalid position index');
    LiquidityPosition memory position = companyPositions[company][positionIndex];
    return (
      position.pool,
      position.positionId,
      position.totalAmount,
      position.availableAmount,
      position.totalRewards,
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
    require(positionIndex < companyPositionCount[company], 'Invalid position index');
    require(companyPositions[company][positionIndex].isActive, 'Position not active');

    LiquidityPosition storage position = companyPositions[company][positionIndex];
    uint256 oldAmount = position.totalAmount;

    // Calculate the difference and update available amount
    if (newAmount > oldAmount) {
      position.availableAmount += (newAmount - oldAmount);
    } else {
      require(
        position.availableAmount >= (oldAmount - newAmount),
        'Cannot reduce below available amount'
      );
      position.availableAmount -= (oldAmount - newAmount);
    }

    position.totalAmount = newAmount;
  }

  /**
   * @dev Cancel a vesting and return the amount to available
   * @param vestingId ID of the vesting to cancel
   * @param company Address of the company
   */
  function cancelVesting(uint256 vestingId, address company) external onlyOwner {
    require(vestings[vestingId].isActive, 'Vesting not active');

    VestingInfo storage vesting = vestings[vestingId];
    uint256 positionIndex = vesting.positionIndex;
    uint256 remainingAmount = vesting.totalAmount;

    // Return remaining amount to available
    companyPositions[company][positionIndex].availableAmount += remainingAmount;

    // Mark vesting as inactive
    vesting.isActive = false;
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
    require(
      IERC20(MockLiquidityPool(pool).token0()).transferFrom(company, address(this), amount0),
      'Token0 transfer failed'
    );
    require(
      IERC20(MockLiquidityPool(pool).token1()).transferFrom(company, address(this), amount1),
      'Token1 transfer failed'
    );

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
   * @dev Internal function to create vesting
   * @param vestingId Unique identifier for the vesting
   * @param company Address of the company
   * @param positionIndex Index of the liquidity position
   * @param amount Amount to vest
   * @param startTime When the vesting starts
   * @param endTime When the vesting ends
   */
  function _createVesting(
    uint256 vestingId,
    address company,
    uint256 positionIndex,
    uint256 amount,
    uint256 startTime,
    uint256 endTime
  ) internal {
    require(positionIndex < companyPositionCount[company], 'Invalid position index');
    require(companyPositions[company][positionIndex].isActive, 'Position not active');
    require(
      companyPositions[company][positionIndex].availableAmount >= amount,
      'Insufficient available amount'
    );

    // Update available amount
    companyPositions[company][positionIndex].availableAmount -= amount;

    // Create vesting
    VestingInfo storage vesting = vestings[vestingId];
    vesting.positionIndex = positionIndex;
    vesting.totalAmount = amount;
    vesting.startTime = startTime;
    vesting.endTime = endTime;
    vesting.isActive = true;
  }

  /**
   * @dev Add liquidity position and create vesting in a single transaction
   * @param company Address of the company
   * @param pool Address of the liquidity pool
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   * @param vestingId Unique identifier for the vesting
   * @param vestingAmount Amount to vest
   * @param startTime When the vesting starts
   * @param endTime When the vesting ends
   */
  function addLiquidityAndCreateVesting(
    address company,
    address pool,
    uint256 amount0,
    uint256 amount1,
    uint256 vestingId,
    uint256 vestingAmount,
    uint256 startTime,
    uint256 endTime
  ) external {
    uint256 positionIndex = _addLiquidityPosition(company, pool, amount0, amount1);
    _createVesting(vestingId, company, positionIndex, vestingAmount, startTime, endTime);
  }
}
