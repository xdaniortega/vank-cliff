import { task } from "hardhat/config";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { CompanyLiquidityManager } from "../typechain-types";
import { Log } from "ethers";

// Task to create a new payroll
task("payroll:create", "Create a new payroll")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("company", "Address of the company")
    .addParam("positionIndex", "Index of the liquidity position")
    .addParam("payrollId", "Unique identifier for the payroll")
    .addParam("beneficiaries", "Comma-separated list of beneficiary addresses")
    .addParam("amounts", "Comma-separated list of amounts per beneficiary")
    .addParam("startTime", "Start time of the payroll (Unix timestamp)")
    .addParam("endTime", "End time of the payroll (Unix timestamp)")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        
        const beneficiaries = taskArgs.beneficiaries.split(",");
        const amounts = taskArgs.amounts.split(",").map((amount: string) => hre.ethers.parseEther(amount));
        
        const tx = await contract.createPayrollMulti(
            taskArgs.payrollId,
            taskArgs.company,
            taskArgs.positionIndex,
            beneficiaries,
            amounts,
            taskArgs.startTime,
            taskArgs.endTime
        );
        
        const receipt = await tx.wait();
        console.log(`Payroll created with ID: ${taskArgs.payrollId}`);
        
        // Find the PayrollCreated event
        const event = receipt?.logs.find(
            (log: Log) => {
                try {
                    return contract.interface.parseLog(log)?.name === "PayrollCreated";
                } catch {
                    return false;
                }
            }
        );
        
        if (event) {
            const parsedLog = contract.interface.parseLog(event);
            console.log("Payroll details:");
            console.log(`Company: ${parsedLog?.args.company}`);
            console.log(`Position Index: ${parsedLog?.args.positionIndex}`);
            console.log(`Start Time: ${new Date(Number(parsedLog?.args.startTime) * 1000).toISOString()}`);
            console.log(`End Time: ${new Date(Number(parsedLog?.args.endTime) * 1000).toISOString()}`);
        }
    });

// Task to claim payroll amount
task("payroll:claim", "Claim payroll amount for a beneficiary")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("payrollId", "ID of the payroll")
    .addParam("company", "Address of the company")
    .addParam("beneficiary", "Address of the beneficiary claiming the rewards")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        
        // Get the signer for the beneficiary
        const beneficiarySigner = await hre.ethers.getSigner(taskArgs.beneficiary);
        const contractWithSigner = contract.connect(beneficiarySigner);
        
        // @ts-ignore - The function exists in the contract but TypeScript doesn't know about it
        const tx = await contractWithSigner.claimPayrollAmount(taskArgs.payrollId, taskArgs.company);
        const receipt = await tx.wait();
        
        // Find the PayrollClaimed event
        const event = receipt?.logs.find(
            (log: Log) => {
                try {
                    return contract.interface.parseLog(log)?.name === "PayrollClaimed";
                } catch {
                    return false;
                }
            }
        );
        
        if (event) {
            const parsedLog = contract.interface.parseLog(event);
            console.log(`Payroll claimed successfully:`);
            console.log(`Payroll ID: ${parsedLog?.args.payrollId}`);
            console.log(`Beneficiary: ${parsedLog?.args.beneficiary}`);
            console.log(`Amount: ${hre.ethers.formatEther(parsedLog?.args.amount)}`);
        }
    });

// Task to get rewards information
task("rewards:info", "Get rewards information for a company and its employees")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("company", "Address of the company")
    .addParam("positionIndex", "Index of the liquidity position")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        
        // Get position info
        const positionInfo = await contract.getPositionInfo(taskArgs.company, taskArgs.positionIndex);
        
        console.log("\nCompany Position Rewards:");
        console.log("------------------------");
        console.log(`Total Rewards: ${hre.ethers.formatEther(positionInfo.totalRewards)}`);
        console.log(`Claimed Rewards: ${hre.ethers.formatEther(positionInfo.claimedRewards)}`);
        console.log(`Available Rewards: ${hre.ethers.formatEther(positionInfo.totalRewards - positionInfo.claimedRewards)}`);
        
        // Get all payrolls for this position
        // Note: This would require additional contract functions to track all payrolls per position
        // For now, we'll just show the position-level rewards
    });

// Task to claim rewards
task("rewards:claim", "Claim rewards from a position")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("company", "Address of the company")
    .addParam("positionIndex", "Index of the position")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        
        const tx = await contract.claimRewards(taskArgs.company, taskArgs.positionIndex);
        const receipt = await tx.wait();
        
        // Find the RewardsClaimed event
        const event = receipt?.logs.find(
            (log: Log) => {
                try {
                    return contract.interface.parseLog(log)?.name === "RewardsClaimed";
                } catch {
                    return false;
                }
            }
        );
        
        if (event) {
            const parsedLog = contract.interface.parseLog(event);
            console.log(`Rewards claimed successfully:`);
            console.log(`Company: ${parsedLog?.args.company}`);
            console.log(`Position Index: ${parsedLog?.args.positionIndex}`);
            console.log(`Amount: ${hre.ethers.formatEther(parsedLog?.args.amount)}`);
        }
    });

// Task to add liquidity position
task("liquidity:add", "Add a new liquidity position")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("company", "Address of the company")
    .addParam("pool", "Address of the liquidity pool")
    .addParam("amount0", "Amount of token0 to add")
    .addParam("amount1", "Amount of token1 to add")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        const pool = await hre.ethers.getContractAt("MockLiquidityPool", taskArgs.pool);
        
        // Get token addresses from pool
        const token0Address = await pool.token0();
        const token1Address = await pool.token1();
        
        // Get token contracts
        const token0 = await hre.ethers.getContractAt("IERC20", token0Address);
        const token1 = await hre.ethers.getContractAt("IERC20", token1Address);
        
        // Approve tokens
        console.log("Approving token0...");
        const approve0Tx = await token0.approve(
            taskArgs.contract,
            hre.ethers.parseEther(taskArgs.amount0)
        );
        await approve0Tx.wait();
        console.log("Token0 approved");
        
        console.log("Approving token1...");
        const approve1Tx = await token1.approve(
            taskArgs.contract,
            hre.ethers.parseEther(taskArgs.amount1)
        );
        await approve1Tx.wait();
        console.log("Token1 approved");
        
        // Add liquidity
        console.log("Adding liquidity position...");
        const tx = await contract.addLiquidityPosition(
            taskArgs.company,
            taskArgs.pool,
            hre.ethers.parseEther(taskArgs.amount0),
            hre.ethers.parseEther(taskArgs.amount1)
        );
        
        const receipt = await tx.wait();
        console.log(`Liquidity position added successfully`);
        
        // Find the LiquidityPositionAdded event
        const event = receipt?.logs.find(
            (log: Log) => {
                try {
                    return contract.interface.parseLog(log)?.name === "LiquidityPositionAdded";
                } catch {
                    return false;
                }
            }
        );
        
        if (event) {
            const parsedLog = contract.interface.parseLog(event);
            console.log("\nPosition details:");
            console.log("----------------");
            console.log(`Company: ${parsedLog?.args.company}`);
            console.log(`Pool: ${parsedLog?.args.pool}`);
            console.log(`Position ID: ${parsedLog?.args.positionId}`);
            console.log(`Amount0: ${hre.ethers.formatEther(parsedLog?.args.amount0)}`);
            console.log(`Amount1: ${hre.ethers.formatEther(parsedLog?.args.amount1)}`);
        }
    });

// Task to get position info
task("liquidity:info", "Get information about a liquidity position")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("company", "Address of the company")
    .addParam("positionindex", "Index of the position")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        
        const positionInfo = await contract.getPositionInfo(taskArgs.company, taskArgs.positionindex);
        
        console.log("\nLiquidity Position Info:");
        console.log("------------------------");
        console.log(`Pool: ${positionInfo.pool}`);
        console.log(`Position ID: ${positionInfo.positionId}`);
        console.log(`Total Amount: ${hre.ethers.formatEther(positionInfo.totalAmount)}`);
        console.log(`Available Amount: ${hre.ethers.formatEther(positionInfo.availableAmount)}`);
        console.log(`Total Rewards: ${hre.ethers.formatEther(positionInfo.totalRewards)}`);
        console.log(`Claimed Rewards: ${hre.ethers.formatEther(positionInfo.claimedRewards)}`);
        console.log(`Is Active: ${positionInfo.isActive}`);
    });

// Task to advance time and check rewards
task("rewards:simulate", "Advance time and check rewards for company and users")
    .addParam("contract", "Address of the CompanyLiquidityManager contract")
    .addParam("company", "Address of the company")
    .addParam("positionindex", "Index of the position")
    .addParam("payrollId", "ID of the payroll")
    .addParam("days", "Number of days to advance")
    .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
        const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract) as CompanyLiquidityManager;
        
        // Get current block timestamp
        const currentBlock = await hre.ethers.provider.getBlock("latest");
        const currentTimestamp = currentBlock?.timestamp || 0;
        
        // Calculate new timestamp (advance by days)
        const secondsToAdvance = Number(taskArgs.days) * 24 * 60 * 60;
        const newTimestamp = currentTimestamp + secondsToAdvance;
        
        console.log(`\nAdvancing time by ${taskArgs.days} days...`);
        console.log(`Current timestamp: ${new Date(currentTimestamp * 1000).toISOString()}`);
        console.log(`New timestamp: ${new Date(newTimestamp * 1000).toISOString()}`);
        
        // Advance time
        await hre.network.provider.send("evm_setNextBlockTimestamp", [newTimestamp]);
        await hre.network.provider.send("evm_mine");
        
        // Get position info for company rewards
        const positionInfo = await contract.getPositionInfo(taskArgs.company, taskArgs.positionindex);
        
        console.log("\nCompany Position Rewards:");
        console.log("------------------------");
        console.log(`Total Rewards: ${hre.ethers.formatEther(positionInfo.totalRewards)}`);
        console.log(`Claimed Rewards: ${hre.ethers.formatEther(positionInfo.claimedRewards)}`);
        console.log(`Available Rewards: ${hre.ethers.formatEther(positionInfo.totalRewards - positionInfo.claimedRewards)}`);
        
        // Get payroll info for user rewards
        const payrollInfo = await contract.getPayrollInfo(taskArgs.payrollId);
        
        console.log("\nPayroll Info:");
        console.log("-------------");
        console.log(`Position Index: ${payrollInfo.positionIndex}`);
        console.log(`Total Amount: ${hre.ethers.formatEther(payrollInfo.amount)}`);
        console.log(`Start Time: ${new Date(Number(payrollInfo.startTime) * 1000).toISOString()}`);
        console.log(`End Time: ${new Date(Number(payrollInfo.endTime) * 1000).toISOString()}`);
        console.log(`Claimed Amount: ${hre.ethers.formatEther(payrollInfo.claimedAmount)}`);
        console.log(`Is Active: ${payrollInfo.isActive}`);
        
        // Check if payroll has ended
        if (newTimestamp >= Number(payrollInfo.endTime)) {
            console.log("\nPayroll has ended! Users can now claim their rewards.");
            console.log("To claim rewards, use the payroll:claim task with the beneficiary address.");
        } else {
            const remainingTime = Number(payrollInfo.endTime) - newTimestamp;
            const remainingDays = Math.floor(remainingTime / (24 * 60 * 60));
            console.log(`\nPayroll is still active. ${remainingDays} days remaining until users can claim.`);
        }
    });

task("rewards:add", "Mint and add rewards to a pool position")
  .addParam("contract", "Address of the CompanyLiquidityManager contract")
  .addParam("company", "Address of the company (must be a Hardhat account)")
  .addParam("positionindex", "Index of the liquidity position")
  .addParam("amount", "Amount of rewards to add (in ether units)")
  .setAction(async (taskArgs, hre) => {
    const contract = await hre.ethers.getContractAt("CompanyLiquidityManager", taskArgs.contract);
    const positionInfo = await contract.getPositionInfo(taskArgs.company, taskArgs.positionindex);
    const pool = await hre.ethers.getContractAt("MockLiquidityPool", positionInfo.pool);
    const token0Address = await pool.token0();
    const token0 = await hre.ethers.getContractAt("MockToken", token0Address);
    const amount = hre.ethers.parseEther(taskArgs.amount);

    // Chequear balance del company
    let balance = await token0.balanceOf(taskArgs.company);
    if (balance < amount) {
      // Mint tokens al company
      const [signer] = await hre.ethers.getSigners();
      const mintTx = await token0.connect(signer).mint(taskArgs.company, amount - balance);
      await mintTx.wait();
      console.log(`Minted ${hre.ethers.formatEther(amount - balance)} tokens to company`);
    }

    // Aprobar el pool para transferir tokens
    const companySigner = await hre.ethers.getSigner(taskArgs.company);
    const approveTx = await token0.connect(companySigner).approve(pool.target, amount);
    await approveTx.wait();
    console.log("Approved pool to spend rewards");

    // Añadir rewards a la posición
    const addRewardsTx = await pool.connect(companySigner).addRewards(positionInfo.positionId, amount);
    await addRewardsTx.wait();
    console.log(`Added ${taskArgs.amount} rewards to position ${positionInfo.positionId}`);
  });
