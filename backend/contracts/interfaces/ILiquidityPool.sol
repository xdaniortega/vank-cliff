// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title ILiquidityPool
 * @notice Interface for liquidity pool operations
 */
interface ILiquidityPool {
  /**
   * @notice Get the address of token0
   * @return Address of token0
   */
  function token0() external view returns (address);

  /**
   * @notice Get the address of token1
   * @return Address of token1
   */
  function token1() external view returns (address);

  /**
   * @notice Add liquidity to the pool
   * @param amount0 Amount of token0 to add
   * @param amount1 Amount of token1 to add
   * @return positionId ID of the created position
   * @return liquidity Amount of liquidity tokens received
   */
  function addLiquidity(
    uint256 amount0,
    uint256 amount1
  ) external returns (uint256 positionId, uint256 liquidity);

  /**
   * @notice Claim rewards for a position
   * @param positionId ID of the position
   * @return amount Amount of rewards claimed
   */
  function claimRewards(uint256 positionId) external returns (uint256 amount);

  /**
   * @notice Calculate rewards for a position
   * @param positionId ID of the position
   * @return amount Amount of rewards available
   */
  function calculateRewards(uint256 positionId) external view returns (uint256 amount);
}
