// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./MockToken.sol";

/**
 * @title MockLiquidityPool
 * @dev Mock contract that simulates a Uniswap V3-like liquidity pool
 */
contract MockLiquidityPool is Ownable {
  IERC20 public immutable token0;
  IERC20 public immutable token1;

  // Struct to store position information
  struct Position {
    address owner;
    uint256 amount0;
    uint256 amount1;
    uint256 liquidity;
    uint256 rewards;
    uint256 lastRewardUpdate;
    bool isActive;
  }

  // Mapping from position ID to position info
  mapping(uint256 => Position) public positions;
  uint256 public nextPositionId;

  // Mock reward rate (rewards per second per liquidity unit)
  uint256 public constant REWARD_RATE = 1e16; // Increased to 0.01 tokens per second per liquidity unit
  uint256 public constant INITIAL_REWARDS = 1000000 * 1e18; // 1M tokens as initial rewards

  // Events
  event PositionCreated(
    uint256 indexed positionId,
    address indexed owner,
    uint256 amount0,
    uint256 amount1,
    uint256 liquidity
  );
  event PositionRemoved(
    uint256 indexed positionId,
    address indexed owner,
    uint256 amount0,
    uint256 amount1,
    uint256 rewards
  );
  event RewardsClaimed(uint256 indexed positionId, address indexed owner, uint256 amount);
  event RewardsAdded(uint256 indexed positionId, uint256 amount);

  constructor(address _token0, address _token1, address _owner) Ownable(_owner) {
    token0 = IERC20(_token0);
    token1 = IERC20(_token1);
    
    // Mint initial rewards to the pool
    MockToken(address(token0)).mint(address(this), INITIAL_REWARDS);
  }

  /**
   * @dev Mock function to add liquidity (similar to Uniswap V3)
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   * @return positionId The ID of the created position
   * @return liquidity The amount of liquidity tokens minted
   */
  function addLiquidity(
    uint256 amount0,
    uint256 amount1
  ) external returns (uint256 positionId, uint256 liquidity) {
    require(amount0 > 0 || amount1 > 0, 'Must add some liquidity');

    // Transfer tokens from user
    if (amount0 > 0) {
      require(token0.transferFrom(msg.sender, address(this), amount0), 'Token0 transfer failed');
    }
    if (amount1 > 0) {
      require(token1.transferFrom(msg.sender, address(this), amount1), 'Token1 transfer failed');
    }

    // Calculate liquidity (simplified for mock)
    liquidity = amount0 + amount1;

    // Create position
    positionId = nextPositionId++;
    positions[positionId] = Position({
      owner: msg.sender,
      amount0: amount0,
      amount1: amount1,
      liquidity: liquidity,
      rewards: 0,
      lastRewardUpdate: block.timestamp,
      isActive: true
    });

    emit PositionCreated(positionId, msg.sender, amount0, amount1, liquidity);
    return (positionId, liquidity);
  }

  /**
   * @dev Mock function to remove liquidity
   * @param positionId The ID of the position to remove
   * @return amount0 Amount of token0 returned
   * @return amount1 Amount of token1 returned
   * @return rewards Amount of rewards claimed
   */
  function removeLiquidity(
    uint256 positionId
  ) external returns (uint256 amount0, uint256 amount1, uint256 rewards) {
    Position storage position = positions[positionId];
    require(position.owner == msg.sender, 'Not position owner');
    require(position.isActive, 'Position not active');

    // Calculate rewards
    rewards = calculateRewards(positionId);

    // Update position
    amount0 = position.amount0;
    amount1 = position.amount1;
    position.isActive = false;
    position.rewards = 0;
    position.lastRewardUpdate = block.timestamp;

    // Transfer tokens back to user
    if (amount0 > 0) {
      require(token0.transfer(msg.sender, amount0), 'Token0 transfer failed');
    }
    if (amount1 > 0) {
      require(token1.transfer(msg.sender, amount1), 'Token1 transfer failed');
    }

    emit PositionRemoved(positionId, msg.sender, amount0, amount1, rewards);
    return (amount0, amount1, rewards);
  }

  /**
   * @dev Calculate rewards for a position
   * @param positionId The ID of the position
   * @return rewards Amount of rewards accumulated
   */
  function calculateRewards(uint256 positionId) public view returns (uint256 rewards) {
    Position storage position = positions[positionId];
    if (!position.isActive) return 0;

    uint256 timeElapsed = block.timestamp - position.lastRewardUpdate;
    uint256 calculatedRewards = position.rewards +
      (position.liquidity * REWARD_RATE * timeElapsed) /
      1e18;

    // Ensure rewards don't exceed available balance
    uint256 availableBalance = token0.balanceOf(address(this));
    return calculatedRewards > availableBalance ? availableBalance : calculatedRewards;
  }

  /**
   * @dev Claim rewards from a position
   * @param positionId The ID of the position
   * @return rewards Amount of rewards claimed
   */
  function claimRewards(uint256 positionId) external returns (uint256 rewards) {
    Position storage position = positions[positionId];
    require(position.owner == msg.sender, 'Not position owner');
    require(position.isActive, 'Position not active');

    rewards = calculateRewards(positionId);
    require(rewards > 0, 'No rewards to claim');

    // Update position
    position.rewards = 0;
    position.lastRewardUpdate = block.timestamp;

    // Transfer rewards (in this mock, we use token0 as reward token)
    require(token0.transfer(msg.sender, rewards), 'Reward transfer failed');

    emit RewardsClaimed(positionId, msg.sender, rewards);
    return rewards;
  }

  /**
   * @dev Get position information
   * @param positionId The ID of the position
   * @return owner The owner of the position
   * @return amount0 Amount of token0 in position
   * @return amount1 Amount of token1 in position
   * @return liquidity Amount of liquidity tokens
   * @return rewards Current rewards
   * @return isActive Whether the position is active
   */
  function getPosition(
    uint256 positionId
  )
    external
    view
    returns (
      address owner,
      uint256 amount0,
      uint256 amount1,
      uint256 liquidity,
      uint256 rewards,
      bool isActive
    )
  {
    Position storage position = positions[positionId];
    return (
      position.owner,
      position.amount0,
      position.amount1,
      position.liquidity,
      calculateRewards(positionId),
      position.isActive
    );
  }

  // Function to manually add rewards for testing
  function addRewards(uint256 positionId, uint256 amount) external onlyOwner {
    Position storage position = positions[positionId];
    require(position.isActive, 'Position not active');

    // Transfer rewards from owner
    require(token0.transferFrom(msg.sender, address(this), amount), 'Reward transfer failed');

    // Add rewards to position
    position.rewards += amount;

    emit RewardsAdded(positionId, amount);
  }
}
