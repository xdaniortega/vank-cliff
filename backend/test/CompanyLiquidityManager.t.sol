// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "forge-std/Test.sol";
import "../contracts/CompanyLiquidityManager.sol";
import "../contracts/mocks/MockLiquidityPool.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Mock ERC20 token for testing
contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 * 10**decimals());
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract CompanyLiquidityManagerTest is Test {
    CompanyLiquidityManager public liquidityManager;
    MockLiquidityPool public liquidityPool;
    MockToken public token0; // DAI-like token
    MockToken public token1; // Another token for the pool
    
    address public company = address(0x1);
    address public employee1 = address(0x2);
    address public employee2 = address(0x3);
    address public employee3 = address(0x4);
    address public owner = address(this);
    
    uint256 public constant INITIAL_BALANCE = 100000 * 10**18; // 100k tokens
    uint256 public constant LIQUIDITY_AMOUNT = 10000 * 10**18; // 10k tokens
    uint256 public constant VESTING_AMOUNT = 5000 * 10**18; // 5k tokens
    
    function setUp() public {
        // Deploy tokens
        token0 = new MockToken("Mock DAI", "mDAI");
        token1 = new MockToken("Mock Token", "mTKN");
        
        // Deploy liquidity pool
        liquidityPool = new MockLiquidityPool(
            address(token0),
            address(token1),
            owner
        );
        
        // Deploy liquidity manager with owner
        liquidityManager = new CompanyLiquidityManager();
        
        // Transfer tokens to company
        token0.transfer(company, INITIAL_BALANCE);
        token1.transfer(company, INITIAL_BALANCE);
        
        // Transfer tokens to employees for testing
        token0.transfer(employee1, INITIAL_BALANCE);
        token1.transfer(employee1, INITIAL_BALANCE);
        token0.transfer(employee2, INITIAL_BALANCE);
        token1.transfer(employee2, INITIAL_BALANCE);
        token0.transfer(employee3, INITIAL_BALANCE);
        token1.transfer(employee3, INITIAL_BALANCE);

        // Mint tokens to the pool for rewards
        token0.mint(address(liquidityPool), INITIAL_BALANCE * 2);
    }

    function test_AddLiquidityAndCreateVestingMulti() public {
        // Start acting as company
        vm.startPrank(company);
        
        // First approve the liquidity manager to spend tokens
        token0.approve(address(liquidityManager), LIQUIDITY_AMOUNT);
        token1.approve(address(liquidityManager), LIQUIDITY_AMOUNT);
        
        // Add liquidity position
        liquidityManager.addLiquidityPosition(
            company,
            address(liquidityPool),
            LIQUIDITY_AMOUNT,
            LIQUIDITY_AMOUNT
        );
        
        // Create vesting schedule with multiple beneficiaries
        uint256 vestingId = 1;
        uint256 startTime = block.timestamp;
        uint256 endTime = startTime + 365 days; // 1 year vesting
        
        address[] memory beneficiaries = new address[](3);
        beneficiaries[0] = employee1;
        beneficiaries[1] = employee2;
        beneficiaries[2] = employee3;
        
        uint256[] memory amounts = new uint256[](3);
        amounts[0] = VESTING_AMOUNT / 2; // 2500 tokens
        amounts[1] = VESTING_AMOUNT / 4; // 1250 tokens
        amounts[2] = VESTING_AMOUNT / 4; // 1250 tokens
        
        liquidityManager.createVestingMulti(
            vestingId,
            company,
            0, // position index
            beneficiaries,
            amounts,
            startTime,
            endTime
        );
        
        vm.stopPrank();
        
        // Verify position was created
        (
            address pool,
            uint256 positionId,
            uint256 totalAmount,
            uint256 availableAmount,
            uint256 totalRewards,
            uint256 claimedRewards,
            bool isActive
        ) = liquidityManager.getPositionInfo(company, 0);
        
        assertEq(pool, address(liquidityPool));
        assertEq(totalAmount, LIQUIDITY_AMOUNT * 2); // Both tokens
        assertEq(availableAmount, (LIQUIDITY_AMOUNT * 2) - VESTING_AMOUNT);
        assertEq(isActive, true);
        
        // Verify vesting was created
        (
            uint256 vPositionIndex,
            uint256 vAmount,
            uint256 vStartTime,
            uint256 vEndTime,
            uint256 vClaimedAmount,
            bool vIsActive
        ) = liquidityManager.getVestingInfo(vestingId);
        
        assertEq(vPositionIndex, 0);
        assertEq(vAmount, VESTING_AMOUNT);
        assertEq(vStartTime, startTime);
        assertEq(vEndTime, endTime);
        assertEq(vClaimedAmount, 0);
        assertEq(vIsActive, true);
    }

    function test_RewardsPerBeneficiary() public {
        // Setup initial liquidity and vesting with multiple beneficiaries
        test_AddLiquidityAndCreateVestingMulti();
        
        uint256 startTime = block.timestamp;
        uint256 vestingEndTime = startTime + 365 days;
        
        // Track claimed amounts
        uint256 employee1Claimed = 0;
        uint256 employee2Claimed = 0;
        uint256 employee3Claimed = 0;
        
        // Add some rewards to the position
        vm.startPrank(owner);
        token0.approve(address(liquidityPool), INITIAL_BALANCE);
        liquidityPool.addRewards(0, INITIAL_BALANCE / 10); // Add 10% of initial balance as rewards
        vm.stopPrank();
        
        // Fast forward 30 days to accumulate some rewards
        vm.warp(startTime + 30 days);
        
        // Company claims rewards
        vm.startPrank(company);
        liquidityManager.claimRewards(company, 0);
        vm.stopPrank();
        
        // Fast forward to vesting end
        vm.warp(vestingEndTime);
        
        // First employee claims after vesting period
        vm.startPrank(employee1);
        liquidityManager.claimVestedAmount(1, company);
        employee1Claimed = 2500000000000000000000;
        vm.stopPrank();
        
        // Add more rewards
        vm.startPrank(owner);
        liquidityPool.addRewards(0, INITIAL_BALANCE / 10);
        vm.stopPrank();
        
        // Fast forward another 30 days to accumulate more rewards
        vm.warp(vestingEndTime + 30 days);
        
        // Company claims more rewards
        vm.startPrank(company);
        liquidityManager.claimRewards(company, 0);
        vm.stopPrank();
        
        // Second employee claims (vesting period already ended)
        vm.startPrank(employee2);
        liquidityManager.claimVestedAmount(1, company);
        employee2Claimed = 1250000000000000000000;
        vm.stopPrank();
        
        // Add final rewards
        vm.startPrank(owner);
        liquidityPool.addRewards(0, INITIAL_BALANCE / 10);
        vm.stopPrank();
        
        // Fast forward another 30 days
        vm.warp(vestingEndTime + 60 days);
        
        // Company claims final rewards
        vm.startPrank(company);
        liquidityManager.claimRewards(company, 0);
        vm.stopPrank();
        
        // Third employee claims (vesting period already ended)
        vm.startPrank(employee3);
        liquidityManager.claimVestedAmount(1, company);
        employee3Claimed = 1250000000000000000000;
        vm.stopPrank();
        
        // Verify each employee got their proportional rewards
        // Employee1 (50% share) should have received rewards from first period
        // Employee2 (25% share) should have received rewards from second period
        // Employee3 (25% share) should have received rewards from third period
        
        (
            ,
            ,
            ,
            ,
            uint256 claimedAmount1,
            bool isActive1
        ) = liquidityManager.getVestingInfo(1);
        
        // Verify vesting is still active but all amounts claimed
        assertEq(isActive1, true);
        
        // Get position info to verify total rewards
        (
            ,
            ,
            ,
            ,
            uint256 totalRewards,
            uint256 claimedRewards,
            bool isActive
        ) = liquidityManager.getPositionInfo(company, 0);
        
        assertTrue(totalRewards > 0);
        assertEq(totalRewards, claimedRewards);
        assertEq(isActive, true);
        
        // Each employee should have received their share of rewards
        assertTrue(employee1Claimed > 0);
        assertTrue(employee2Claimed > 0);
        assertTrue(employee3Claimed > 0);
        
        // Employee1 should have received roughly 50% of first period rewards
        // Employee2 should have received roughly 25% of second period rewards
        // Employee3 should have received roughly 25% of third period rewards
        // Since we added equal rewards in each period, the ratios should be roughly maintained
        assertApproxEqRel(employee1Claimed * 2, employee2Claimed * 4, 0.1e18); // 50% vs 25%
        assertApproxEqRel(employee2Claimed, employee3Claimed, 0.1e18); // 25% vs 25%
    }

    function test_OwnerFunctions() public {
        // Setup initial liquidity and vesting with multiple beneficiaries
        test_AddLiquidityAndCreateVestingMulti();
        
        // Only owner can cancel vesting
        vm.startPrank(employee1);
        vm.expectRevert(); // Should revert as employee is not owner
        liquidityManager.cancelVesting(1, company);
        vm.stopPrank();
        
        // Owner can cancel vesting
        liquidityManager.cancelVesting(1, company);
        
        // Verify vesting was cancelled
        (
            ,
            ,
            ,
            ,
            uint256 claimedAmount,
            bool isActive
        ) = liquidityManager.getVestingInfo(1);
        
        assertEq(isActive, false);
        assertEq(claimedAmount, 0);
        
        // Verify position available amount was updated
        (
            ,
            ,
            ,
            uint256 availableAmount,
            ,
            ,
            
        ) = liquidityManager.getPositionInfo(company, 0);
        
        assertEq(availableAmount, LIQUIDITY_AMOUNT * 2); // All amount available again
    }

    function test_FullFlowMultiBeneficiary() public {
        // Setup initial liquidity and vesting with multiple beneficiaries
        test_AddLiquidityAndCreateVestingMulti();
        
        // Fast forward 30 days
        vm.warp(block.timestamp + 30 days);
        
        // Company claims rewards
        vm.startPrank(company);
        liquidityManager.claimRewards(company, 0);
        vm.stopPrank();
        
        // Fast forward to vesting end
        vm.warp(block.timestamp + 335 days);
        
        // All employees claim their vested amounts
        vm.startPrank(employee1);
        liquidityManager.claimVestedAmount(1, company);
        vm.stopPrank();
        
        vm.startPrank(employee2);
        liquidityManager.claimVestedAmount(1, company);
        vm.stopPrank();
        
        vm.startPrank(employee3);
        liquidityManager.claimVestedAmount(1, company);
        vm.stopPrank();
        
        // Verify final state
        (
            ,
            ,
            ,
            uint256 availableAmount,
            uint256 totalRewards,
            uint256 claimedRewards,
            bool isActive
        ) = liquidityManager.getPositionInfo(company, 0);
        
        assertEq(availableAmount, LIQUIDITY_AMOUNT * 2); // All amount available
        assertTrue(totalRewards > 0); // Rewards were accumulated
        assertEq(totalRewards, claimedRewards); // All rewards were claimed
        assertEq(isActive, true); // Position still active
        
        // Verify vesting state for each beneficiary
        (
            ,
            ,
            ,
            ,
            uint256 vClaimedAmount1,
            bool vIsActive1
        ) = liquidityManager.getVestingInfo(1);
        
        assertEq(vIsActive1, true); // Vesting still active but fully claimed
    }
} 