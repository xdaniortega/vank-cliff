import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("CompanyLiquidity", (m) => {
    // Deploy mock tokens for testing
    const mockToken0 = m.contract("MockToken", ["Mock DAI", "mDAI"], { id: "MockDAI" });
    const mockToken1 = m.contract("MockToken", ["Mock Token", "mTKN"], { id: "MockToken" });

    // Deploy mock liquidity pool with the tokens
    const mockLiquidityPool = m.contract("MockLiquidityPool", [
        mockToken0,
        mockToken1,
        m.getAccount(0) // First account as owner
    ], { id: "MockPool" });

    // Deploy the main contract
    const companyLiquidityManager = m.contract("CompanyLiquidityManager", [], { id: "LiquidityManager" });

    return { 
        mockToken0,
        mockToken1,
        mockLiquidityPool,
        companyLiquidityManager 
    };
}); 