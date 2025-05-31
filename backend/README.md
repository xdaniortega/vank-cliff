# Vank Cliff - Liquidity Management and Payroll/Vesting System

## Overview
Vank Cliff is a sophisticated financial system that combines liquidity management with payroll/vesting schedules, designed to provide secure and efficient management of company liquidity positions and employee compensation. The system operates similarly to a modern investment bank's treasury management system, with integrated features for employee payroll/vesting and reward distribution.

## Core Components

### 1. Liquidity Management
The system functions as a digital treasury management system, allowing companies to:
- Create and manage liquidity positions in various pools
- Track available and allocated liquidity
- Monitor rewards and returns on liquidity positions
- Manage multiple beneficiaries for each position
- Handle position cancellation and emergency withdrawals

### 2. Payroll/Vesting System
Similar to traditional employee stock ownership plans (ESOPs), restricted stock units (RSUs), and corporate payroll systems, the payroll/vesting system provides:
- Time-based payroll/vesting schedules for beneficiaries
- Multiple beneficiary support per schedule
- Reward distribution based on proportional ownership
- Automated claim processes for vested amounts
- Emergency cancellation capabilities for compliance

## Key Features

### Liquidity Position Management
- **Position Creation**: Companies can create liquidity positions by depositing tokens into liquidity pools
- **Position Tracking**: Each position is tracked with:
  - Total amount
  - Available amount
  - Total rewards
  - Claimed rewards
  - Active status
  - Emergency withdrawal status
- **Position Control**:
  - Owner-only cancellation rights
  - Emergency withdrawal capabilities
  - Position status management

### Payroll/Vesting Management
- **Schedule Creation**: Companies can create payroll/vesting schedules with:
  - Multiple beneficiaries
  - Individual allocation amounts
  - Start and end times
  - Position linkage
  - Emergency cancellation options
- **Beneficiary Management**:
  - Individual tracking of vested amounts
  - Claim status monitoring
  - Reward distribution based on ownership percentage
  - Active status tracking
  - Emergency claim handling

### Reward Distribution
The system implements a sophisticated reward distribution mechanism:
1. Rewards are accumulated in the liquidity pool
2. When claimed, rewards are distributed proportionally based on:
   - Beneficiary's vested amount
   - Total payroll/vesting amount
   - Time since vesting unlock
   - Active status of positions and beneficiaries

## Technical Architecture

### Smart Contracts
1. **CompanyLiquidityManager**
   - Manages liquidity positions
   - Handles token transfers
   - Coordinates with payroll/vesting system
   - Tracks rewards and claims
   - Implements emergency controls
   - Manages position cancellation

2. **Payroll/VestingManager**
   - Manages payroll/vesting schedules
   - Tracks beneficiary information
   - Handles vesting claims
   - Coordinates reward distribution
   - Implements emergency cancellation
   - Manages beneficiary status

3. **MockLiquidityPool**
   - Simulates liquidity pool operations
   - Manages position creation
   - Handles reward distribution
   - Tracks pool state
   - Implements emergency withdrawal

### Data Structures
1. **LiquidityPosition**
   ```solidity
   struct LiquidityPosition {
       address pool;
       uint256 positionId;
       uint256 totalAmount;
       uint256 availableAmount;
       uint256 totalRewards;
       uint256 claimedRewards;
       bool isActive;
       bool isEmergencyWithdrawn;
   }
   ```

2. **Payroll/VestingInfo**
   ```solidity
   struct PayrollVestingInfo {
       uint256 id;
       uint256 positionIndex;
       uint256 totalAmount;
       uint256 startTime;
       uint256 endTime;
       bool isActive;
       bool isCancelled;
   }
   ```

3. **BeneficiaryInfo**
   ```solidity
   struct BeneficiaryInfo {
       uint256 amount;
       uint256 claimedAmount;
       bool isActive;
       bool isEmergencyClaimed;
   }
   ```

## Workflow

### 1. Position Creation and Management
1. Company approves token transfers
2. Company creates liquidity position
3. System tracks position and available amounts
4. Owner can cancel position if needed
5. Emergency withdrawal available for compliance

### 2. Payroll/Vesting Schedule Creation
1. Company creates payroll/vesting schedule
2. System allocates amounts to beneficiaries
3. Schedule is linked to position
4. Emergency cancellation available if needed

### 3. Reward Distribution
1. Rewards accumulate in pool
2. Company claims rewards
3. System distributes rewards proportionally
4. Beneficiaries can claim their share
5. Emergency claims handled separately

### 4. Payroll/Vesting Claim Process
1. Payroll/vesting period ends
2. Beneficiary unlocks their portion
3. Beneficiary claims vested amount and rewards
4. System updates tracking information
5. Emergency claims processed if needed

## Security Features
- Role-based access control
- Payroll/vesting period enforcement
- Single-claim protection
- Position status validation
- Amount validation
- Beneficiary verification
- Emergency controls
- Owner-only cancellation rights
- Compliance monitoring

## Use Cases

### Corporate Treasury Management
- Companies can manage their liquidity positions
- Track available and allocated funds
- Monitor returns on investments
- Manage employee payroll/vesting
- Handle emergency situations

### Employee Compensation
- Create payroll/vesting schedules for employees
- Track individual allocations
- Automate reward distribution
- Manage claim processes
- Handle emergency claims

### Investment Management
- Create and manage liquidity positions
- Track returns and rewards
- Distribute profits to stakeholders
- Monitor position performance
- Implement emergency controls

## Testing
The system includes comprehensive test coverage:
- Position creation and management
- Payroll/vesting schedule creation
- Reward distribution
- Claim processes
- Security features
- Emergency scenarios
- Cancellation workflows

## Future Enhancements
1. Additional pool types
2. Enhanced reward mechanisms
3. More flexible payroll/vesting schedules
4. Advanced reporting features
5. Integration with external systems
6. Enhanced emergency controls
7. Compliance automation

# Vank Cliff Backend Testing Guide

This guide walks through the process of testing the Vank Cliff liquidity and payroll system using Hardhat tasks.

## Prerequisites

- Node.js and npm installed
- Hardhat installed (`npm install hardhat@2.24.1`)
- Local blockchain running (e.g., Hardhat Network)

## Test Accounts

For testing, we'll use these default Hardhat accounts:
1. Company Account: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
2. Beneficiary Account: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`

## Contract Addresses

After deployment, these will be the default addresses:
- CompanyLiquidityManager: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- MockPool: `0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9`
- MockToken: `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- MockDAI: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## Step-by-Step Testing Flow

### 1. Deploy Contracts

Deploy all contracts using the Ignition module:
```bash
npx hardhat ignition deploy ignition/modules/CompanyLiquidity.ts --network localhost
```

### 2. Add Liquidity Position

Add a liquidity position using the company account:
```bash
npx hardhat liquidity:add \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --pool 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 \
  --amount0 10.0 \
  --amount1 10.0 \
  --network localhost
```

### 3. Create Payroll

Create a payroll using the company account, linking it to the beneficiary:
```bash
npx hardhat payroll:create \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --position-index 0 \
  --payroll-id 1 \
  --beneficiaries 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --amounts 5 \
  --start-time $(date +%s) \
  --end-time $(($(date +%s) + 604800)) \
  --network localhost
```

### 4. Simulate Time and Check Rewards

Simulate time passage to accumulate rewards:
```bash
npx hardhat rewards:simulate \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --position-index 0 \
  --payroll-id 1 \
  --days 2 \
  --network localhost
```

### 4.1 Liquidity position info
```bash
npx hardhat liquidity:info \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --position-index 0 \
  --network localhost
```

### 5. Claim Rewards

#### Company Claims
Using the company account:
```bash
npx hardhat rewards:claim \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --position-index 0 \
  --network localhost
```

#### Beneficiary Claims
```bash

npx hardhat rewards:simulate \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --position-index 0 \
  --payroll-id 1 \
  --days 7 \
  --network localhost
```

Using the beneficiary account (after payroll period ends):
```bash
npx hardhat payroll:claim \
  --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  --payroll-id 1 \
  --company 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --network localhost
```

### 6. Verify State

Use the Hardhat console to check contract state:
```javascript
// Connect to contracts
const CompanyLiquidityManager = await ethers.getContractFactory("CompanyLiquidityManager")
const manager = await CompanyLiquidityManager.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3")

// Check payroll info
const payrollInfo = await manager.getPayrollInfo(1)
console.log("Payroll Info:", payrollInfo)

// Check position info
const positionInfo = await manager.getPositionInfo("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", 0)
console.log("Position Info:", positionInfo)
```

## Important Notes

1. **Account Usage**
   - Always use the company account (`0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`) for:
     - Adding liquidity
     - Creating payrolls
     - Claiming company rewards
   - Always use the beneficiary account (`0x70997970C51812dc3A010C7d01b50e0d17dc79C8`) for:
     - Claiming payroll rewards

2. **Rewards System**
   - The MockLiquidityPool uses a reward rate of 0.01 tokens per second per liquidity unit
   - Initial rewards (1M tokens) are automatically minted to the pool upon deployment
   - Company rewards can be claimed at any time while the position is active
   - Beneficiary rewards can only be claimed after the payroll period ends

3. **Time Simulation**
   - Use the `rewards:simulate` task to advance time
   - Each day simulated will generate rewards based on the liquidity provided
   - The payroll period must end before beneficiaries can claim their rewards

4. **Common Issues**
   - If rewards aren't showing, verify the pool has enough reward tokens
   - If claims fail, ensure you're using the correct account
   - If payroll claims fail, verify the payroll period has ended