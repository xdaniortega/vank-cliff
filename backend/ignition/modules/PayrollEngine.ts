import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("PayrollEngine", (m) => {
const fakeVestingFactory = "0x0000000000000000000000000000000000000000";
  // Desplegar el VestingFactory primero (si no existe)
  /*const vestingFactory = m.contract("VestingFactory", [], {
    id: "VestingFactory"
  });*/

  // Desplegar el PayrollEngine con la dirección del VestingFactory
  const payrollEngine = m.contract("PayrollEngine", [fakeVestingFactory], {
    id: "PayrollEngine"
  });

  // Configurar el PayrollEngine como owner del VestingFactory
  /*m.call(vestingFactory, "transferOwnership", [payrollEngine], {
    id: "TransferVestingFactoryOwnership"
  });*/

  // Configurar los pools de Curve (comentado por ahora)
  m.call(payrollEngine, "setStablecoinToCurvePoolConfig", [
    "0x...", // tokenA address
    "0x...", // tokenB address
    "0x...", // curvePool address
    0,       // stablecoinIndex
    1        // otherTokenIndex
  ], {
    id: "ConfigureCurvePool"
  });

  return {
    payrollEngine
  };
}); 