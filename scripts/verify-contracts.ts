import { readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';
import FormData from 'form-data';

// Configuración
const BLOCKSCOUT_API_URL = 'https://eth.blockscout.com/api/v2/smart-contracts/verification';
const CONTRACTS_DIR = join(__dirname, '../backend/contracts');
const ARTIFACTS_DIR = join(__dirname, '../backend/artifacts/contracts');

// Contratos a verificar
const CONTRACTS_TO_VERIFY = [
  {
    name: 'MockToken',
    path: 'mocks/MockToken.sol',
    constructorArgs: ['Mock Token', 'mTKN']
  },
  {
    name: 'MockLiquidityPool',
    path: 'mocks/LPTokenMock.sol',
    constructorArgs: [] // Se llenará dinámicamente
  },
  {
    name: 'CompanyLiquidityManager',
    path: 'CompanyLiquidityManager.sol',
    constructorArgs: []
  }
];

// Función para obtener la dirección del contrato desplegado
async function getContractAddress(contractName: string, chainId: number): Promise<string> {
  try {
    const addressesPath = join(__dirname, `../backend/ignition/deployments/chain-${chainId}/deployed_addresses.json`);
    const addresses = JSON.parse(readFileSync(addressesPath, 'utf8'));
    const key = `CompanyLiquidity#${contractName}`;
    return addresses[key];
  } catch (error) {
    console.error(`Error getting contract address for ${contractName}:`, error);
    throw error;
  }
}

// Función para verificar un contrato
async function verifyContract(
  contractName: string,
  contractPath: string,
  constructorArgs: any[],
  chainId: number
) {
  try {
    console.log(`\nVerificando contrato ${contractName}...`);

    // 1. Obtener la dirección del contrato
    const contractAddress = await getContractAddress(contractName, chainId);
    if (!contractAddress) {
      throw new Error(`No se encontró la dirección para ${contractName}`);
    }
    console.log(`Dirección del contrato: ${contractAddress}`);

    // 2. Leer el código fuente
    const sourcePath = join(CONTRACTS_DIR, contractPath);
    const sourceCode = readFileSync(sourcePath, 'utf8');

    // 3. Leer el ABI y bytecode
    const artifactPath = join(ARTIFACTS_DIR, contractPath.replace('.sol', '.json'));
    const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));

    // 4. Preparar los datos para la verificación
    const formData = new FormData();
    formData.append('address_hash', contractAddress);
    formData.append('name', contractName);
    formData.append('compiler_version', 'v0.8.28+commit.7893614a'); // Versión específica de Solidity
    formData.append('optimization', 'true');
    formData.append('optimization_runs', '200');
    formData.append('contract_source_code', sourceCode);
    formData.append('constructor_arguments', JSON.stringify(constructorArgs));
    formData.append('abi', JSON.stringify(artifact.abi));
    formData.append('evm_version', 'paris');
    formData.append('chain_id', chainId.toString());

    // 5. Enviar la solicitud de verificación
    const response = await axios.post(BLOCKSCOUT_API_URL, formData, {
      headers: {
        ...formData.getHeaders(),
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log(`✅ Verificación iniciada para ${contractName}`);
    console.log('Respuesta:', response.data);

    // 6. Verificar el estado de la verificación
    const verificationId = response.data.verification_id;
    if (verificationId) {
      console.log(`Verification ID: ${verificationId}`);
      console.log('Puedes verificar el estado en:');
      console.log(`https://eth.blockscout.com/api/v2/smart-contracts/verification/${verificationId}`);
    }

  } catch (error) {
    console.error(`❌ Error verificando ${contractName}:`, error.response?.data || error.message);
  }
}

// Función principal
async function main() {
  console.log('🚀 Iniciando verificación de contratos...');

  // Verificar en Flow EVM (chainId: 747)
  console.log('\n=== Verificando en Flow EVM (chainId: 747) ===');
  for (const contract of CONTRACTS_TO_VERIFY) {
    await verifyContract(contract.name, contract.path, contract.constructorArgs, 747);
  }

  // Verificar en Localhost (chainId: 31337)
  console.log('\n=== Verificando en Localhost (chainId: 31337) ===');
  for (const contract of CONTRACTS_TO_VERIFY) {
    await verifyContract(contract.name, contract.path, contract.constructorArgs, 31337);
  }

  console.log('\n✨ Proceso de verificación completado');
}

// Ejecutar el script
main().catch(console.error); 