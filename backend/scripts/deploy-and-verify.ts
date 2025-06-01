import { ethers } from "hardhat";

async function main() {
  console.log("🚀 Iniciando despliegue y verificación...");

  // 1. Desplegar MockToken
  console.log("\n=== Desplegando MockToken ===");
  const MockToken = await ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy("Mock Token", "mTKN");
  await mockToken.waitForDeployment();
  const mockTokenAddress = await mockToken.getAddress();
  console.log(`✅ MockToken desplegado en: ${mockTokenAddress}`);

  // 2. Desplegar MockLiquidityPool
  console.log("\n=== Desplegando MockLiquidityPool ===");
  const MockLiquidityPool = await ethers.getContractFactory("MockLiquidityPool");
  const mockPool = await MockLiquidityPool.deploy(mockTokenAddress);
  await mockPool.waitForDeployment();
  const mockPoolAddress = await mockPool.getAddress();
  console.log(`✅ MockLiquidityPool desplegado en: ${mockPoolAddress}`);

  // 3. Desplegar CompanyLiquidityManager
  console.log("\n=== Desplegando CompanyLiquidityManager ===");
  const CompanyLiquidityManager = await ethers.getContractFactory("CompanyLiquidityManager");
  const liquidityManager = await CompanyLiquidityManager.deploy(mockTokenAddress, mockPoolAddress);
  await liquidityManager.waitForDeployment();
  const liquidityManagerAddress = await liquidityManager.getAddress();
  console.log(`✅ CompanyLiquidityManager desplegado en: ${liquidityManagerAddress}`);

  // Esperar unos segundos para asegurar que los bloques se han minado
  console.log("\n⏳ Esperando confirmaciones...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 4. Verificar contratos
  console.log("\n=== Verificando contratos ===");
  
  try {
    // Verificar MockToken
    console.log("\nVerificando MockToken...");
    await hre.run("verify:verify", {
      address: mockTokenAddress,
      constructorArguments: ["Mock Token", "mTKN"],
      network: "flow-evm"
    });
    console.log("✅ MockToken verificado");

    // Verificar MockLiquidityPool
    console.log("\nVerificando MockLiquidityPool...");
    await hre.run("verify:verify", {
      address: mockPoolAddress,
      constructorArguments: [mockTokenAddress],
      network: "flow-evm"
    });
    console.log("✅ MockLiquidityPool verificado");

    // Verificar CompanyLiquidityManager
    console.log("\nVerificando CompanyLiquidityManager...");
    await hre.run("verify:verify", {
      address: liquidityManagerAddress,
      constructorArguments: [mockTokenAddress, mockPoolAddress],
      network: "flow-evm"
    });
    console.log("✅ CompanyLiquidityManager verificado");

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Already Verified")) {
        console.log("⚠️ Contrato ya verificado");
      } else {
        console.error("❌ Error en la verificación:", error.message);
      }
    } else {
      console.error("❌ Error desconocido en la verificación");
    }
  }

  console.log("\n✨ Proceso completado!");
  console.log("\nDirecciones desplegadas:");
  console.log("MockToken:", mockTokenAddress);
  console.log("MockLiquidityPool:", mockPoolAddress);
  console.log("CompanyLiquidityManager:", liquidityManagerAddress);
}

// Ejecutar el script
main().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
}); 