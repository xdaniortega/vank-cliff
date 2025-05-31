// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.28;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { ICurvePool } from "./interfaces/ICurvePool.sol";
import { console } from "forge-std/console.sol";

contract PayrollEngine is Ownable, ReentrancyGuard {
  event VestingFactorySet(address vestingFactory);
  event PayrollCreated(address payroll);
  event TokensSwapped(address stablecoinA, address stablecoinB, uint256 amountA, uint256 amountB);

  error InsufficientBalance();
  error InsufficientAllowance();
  error CurvePoolNotSet();
  struct CompanyData {
    bool isWhitelisted;
    adress
    bytes32[] payrollIds;
  }
  address public vestingFactory;
  mapping(address => CompanyData) public companyData;
  mapping(address => address) public vestingCreated;
  mapping(bytes32 => bytes32) public vestingIdToPosition

  
  // Minimum amounts for slippage protection
  uint256 public constant SLIPPAGE_TOLERANCE = 50; // 0.5%
  uint256 public constant BASIS_POINTS = 10000;

  // Events
  event LiquidityAdded(uint256 stablecoinAmount, uint256 lpTokensReceived);
  event TokensSwapped(uint256 amountIn, uint256 amountOut);
  event StakingCompleted(uint256 lpTokensStaked);

  modifier onlyCompany() {
    require(companyData[msg.sender].isWhitelisted);
    _;
  }

  constructor(address vestingFactory_) Ownable(msg.sender) {
    vestingFactory = vestingFactory_;
  }

  function depositPayroll(address tokenA, address tokenB, uint256 amount) public onlyCompany {
    if (stablecoinToCurvePool[tokenA] == address(0)) {
      revert CurvePoolNotSet();
    }
    if (IERC20(tokenA).balanceOf(msg.sender) < amount) {
      revert InsufficientBalance();
    }
    if (IERC20(tokenA).allowance(msg.sender, address(this)) < amount) {
      revert InsufficientAllowance();
    }

    // First we receive the stablecoin payment
    IERC20(tokenA).transferFrom(msg.sender, address(this), amount);

    // Then we swap the stablecoin to the pair and create the LP token
    // And we stake the LP token in the staking contract and receive
    // Calculate amount to swap (50% of balance)
    uint256 amountToSwap = amount / 2;
    _liquidityBalancer(tokenA, tokenB, amountToSwap);
  }

  function setVestingFactory(address vestingFactory_) public onlyOwner {
    vestingFactory = vestingFactory_;
    emit VestingFactorySet(vestingFactory_);
  }

  function setStablecoinToCurvePoolConfig(address tokenA, address tokenB, address curvePool, uint128 stablecoinIndex, uint128 otherTokenIndex) public onlyOwner {
    stablecoinToCurvePool[tokenA] = curvePool;
    stablecoinToIndex[tokenA] = stablecoinIndex;
    stablecoinToCurvePool[tokenB] = curvePool;
    stablecoinToIndex[tokenB] = otherTokenIndex;
  }

  // INTERNAL FUNCTIONS

  function _swapPair(address stablecoinA, address stablecoinB, address curvePool, uint256 amount) internal nonReentrant returns (uint256) {
    // Get expected output amount from swap
    uint256 expectedOutput = ICurvePool(curvePool).getDy(
        int128(int256(uint256(stablecoinToIndex[stablecoinA]))),
        int128(int256(uint256(stablecoinToIndex[stablecoinB]))),
        amount
    );
    
    // Calculate minimum amount out with slippage protection
    uint256 minAmountOut = expectedOutput * (BASIS_POINTS - SLIPPAGE_TOLERANCE) / BASIS_POINTS;

    // Approve Curve pool to spend stablecoins
    IERC20(stablecoinA).approve(curvePool, amount);

    // Perform the swap
    uint256 amountReceived = ICurvePool(curvePool).exchange(
        int128(int256(uint256(stablecoinToIndex[stablecoinA]))),
        int128(int256(uint256(stablecoinToIndex[stablecoinB]))),
        amount,
        minAmountOut,
        address(this)
    );

    emit TokensSwapped(stablecoinA, stablecoinB, amount, amountReceived);
    return amountReceived;
  }

  function _addLiquidity(address stablecoinA, address stablecoinB, address curvePool, uint256[] memory amounts) internal nonReentrant returns (uint256) {
    // Calculate expected LP tokens
    uint256 expectedLPTokens = ICurvePool(curvePool).calcTokenAmount(amounts, true);
    uint256 minLPTokens = expectedLPTokens * (BASIS_POINTS - SLIPPAGE_TOLERANCE) / BASIS_POINTS;

    // Approve Curve pool to spend both tokens
    IERC20(stablecoinA).approve(curvePool, amounts[0]);
    IERC20(stablecoinB).approve(curvePool, amounts[1]);

    // Add liquidity
    uint256 lpTokensReceived = ICurvePool(curvePool).addLiquidity(
        amounts,
        minLPTokens,
        address(this)
    );

    return lpTokensReceived;
  }

  // This function will manage the ERC20 stablecoin balance received and produce yield
  // Internally it'll swap the stablecoin to a the pair, add liquidity and return the LP tokens
  function _liquidityBalancer(address stablecoinA, address stablecoinB, uint256 amount) internal nonReentrant returns (uint256) {
    address curvePool = stablecoinToCurvePool[stablecoinA];
    uint256 amountReceived = _swapPair(stablecoinA, stablecoinB, curvePool, amount);
    
    // Create amounts array explicitly
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amount;
    amounts[1] = amountReceived;
    
    uint256 lpTokensReceived = _addLiquidity(stablecoinA, stablecoinB, curvePool, amounts);
    console.log("LP tokens received:");
    console.log(lpTokensReceived);
    return lpTokensReceived;
  }
}
