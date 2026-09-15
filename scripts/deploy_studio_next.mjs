import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createClient,
  chains,
  createAccount,
  generatePrivateKey,
  simplifyTransactionReceipt,
} from '../frontend/node_modules/genlayer-js/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Studio Next Configuration
const RPC_URL = 'https://studio-next.genlayer.com/api';
const CHAIN_ID = 61997;

const chain = {
  ...chains.studioDevnet,
  id: CHAIN_ID,
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
};

const privateKey = generatePrivateKey();
const account = createAccount(privateKey);
const client = createClient({ chain, account });

console.log('====================================================');
console.log('  HaltLayer Studio Next Deployment & Verification   ');
console.log('====================================================');
console.log(`Network: Studio Next (${CHAIN_ID} / 0xf22d)`);
console.log(`RPC: ${RPC_URL}`);
console.log(`Deployer Account: ${account.address}`);
console.log('----------------------------------------------------');

async function waitForTx(hash, label = 'Transaction') {
  console.log(`[${label}] Submitted: ${hash}`);
  console.log(`[${label}] Waiting for consensus finalization...`);
  const start = Date.now();
  const receipt = await client.waitForTransactionReceipt({
    hash,
    interval: 3000,
    retries: 60,
  });
  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[${label}] Finalized in ${duration}s | Status: ${receipt.status_name || receipt.status} | Outcome: ${receipt.lifecycle?.outcome || 'unknown'}`);
  return receipt;
}

async function main() {
  const haltLayerPath = path.join(rootDir, 'contracts', 'halt_layer.py');
  const demoVaultPath = path.join(rootDir, 'contracts', 'demo_vault.py');

  const haltLayerCode = fs.readFileSync(haltLayerPath, 'utf8');
  const demoVaultCode = fs.readFileSync(demoVaultPath, 'utf8');

  const deploymentRecord = {
    network: 'Studio Next',
    chainId: CHAIN_ID,
    chainIdHex: '0xf22d',
    rpcUrl: RPC_URL,
    explorerUrl: 'https://explorer-studio-dev.genlayer.com/',
    deployerAddress: account.address,
    timestamp: new Date().toISOString(),
    contracts: {},
    transactions: {},
    verification: {},
  };

  // 1. Deploy HaltLayer
  console.log('\n[Stage 1/6] Deploying HaltLayer Contract...');
  const haltFees = await client.estimateTransactionFees();
  const haltDeployTxHash = await client.deployContract({
    code: haltLayerCode,
    args: [],
    fees: haltFees,
  });
  const haltReceipt = await waitForTx(haltDeployTxHash, 'Deploy HaltLayer');
  const haltAddress = haltReceipt.recipient;
  console.log(`>>> HaltLayer Deployed at: ${haltAddress}`);
  deploymentRecord.contracts.haltLayer = haltAddress;
  deploymentRecord.transactions.deployHaltLayer = haltDeployTxHash;

  // 2. Deploy DemoVault
  console.log('\n[Stage 2/6] Deploying DemoVault Contract (Circuit Breaker = HaltLayer)...');
  const vaultFees = await client.estimateTransactionFees();
  const vaultDeployTxHash = await client.deployContract({
    code: demoVaultCode,
    args: [haltAddress],
    fees: vaultFees,
  });
  const vaultReceipt = await waitForTx(vaultDeployTxHash, 'Deploy DemoVault');
  const vaultAddress = vaultReceipt.recipient;
  console.log(`>>> DemoVault Deployed at: ${vaultAddress}`);
  deploymentRecord.contracts.demoVault = vaultAddress;
  deploymentRecord.transactions.deployDemoVault = vaultDeployTxHash;

  // 3. Register DemoVault in HaltLayer
  console.log('\n[Stage 3/6] Registering DemoVault in HaltLayer Policy...');
  const regFees = await client.estimateTransactionFees();
  const regTxHash = await client.writeContract({
    address: haltAddress,
    functionName: 'register_protocol',
    args: [vaultAddress, 'DemoVault', 'HALT', 'strong'],
    fees: regFees,
  });
  await waitForTx(regTxHash, 'Register Protocol');
  deploymentRecord.transactions.registerProtocol = regTxHash;

  // Verify Initial State
  const initialProtStatus = await client.readContract({
    address: haltAddress,
    functionName: 'get_protection_status',
    args: [vaultAddress],
  });
  const initialVaultPaused = await client.readContract({
    address: vaultAddress,
    functionName: 'is_paused',
    args: [],
  });
  console.log(`  * Initial Protection Status : ${initialProtStatus}`);
  console.log(`  * Initial Vault Paused      : ${initialVaultPaused}`);
  if (initialProtStatus !== 'ACTIVE' || initialVaultPaused !== false) {
    throw new Error(`Initial state mismatch: status=${initialProtStatus}, paused=${initialVaultPaused}`);
  }
  deploymentRecord.verification.initialState = {
    protectionStatus: initialProtStatus,
    vaultPaused: initialVaultPaused,
  };

  // 4. Negative Control Incident
  console.log('\n[Stage 4/6] Executing Negative Control Incident (Weak evidence, benign activity)...');
  const negSubFees = await client.estimateTransactionFees();
  const negSubTxHash = await client.writeContract({
    address: haltAddress,
    functionName: 'submit_incident',
    args: [
      vaultAddress,
      'Routine arbitrage trade volume check with standard swap pattern',
      '0x1111111111111111111111111111111111111111111111111111111111111111',
      '',
    ],
    fees: negSubFees,
  });
  await waitForTx(negSubTxHash, 'Submit Negative Control Incident');
  deploymentRecord.transactions.submitNegativeIncident = negSubTxHash;

  const incident1Id = 'INC-1';
  console.log(`Adjudicating ${incident1Id}...`);
  const negAdjFees = await client.estimateTransactionFees();
  const negAdjTxHash = await client.writeContract({
    address: haltAddress,
    functionName: 'adjudicate_incident',
    args: [incident1Id],
    fees: negAdjFees,
  });
  await waitForTx(negAdjTxHash, 'Adjudicate Negative Control Incident');
  deploymentRecord.transactions.adjudicateNegativeIncident = negAdjTxHash;

  const inc1Details = await client.readContract({
    address: haltAddress,
    functionName: 'get_incident',
    args: [incident1Id],
  });
  const negVaultPaused = await client.readContract({
    address: vaultAddress,
    functionName: 'is_paused',
    args: [],
  });
  const negProtStatus = await client.readContract({
    address: haltAddress,
    functionName: 'get_protection_status',
    args: [vaultAddress],
  });
  console.log(`  * INC-1 Status             : ${inc1Details.status}`);
  console.log(`  * INC-1 Threat Severity    : ${inc1Details.threat_severity}`);
  console.log(`  * INC-1 Action             : ${inc1Details.recommended_action}`);
  console.log(`  * Post-Negative Vault Paused: ${negVaultPaused}`);
  console.log(`  * Post-Negative Prot Status: ${negProtStatus}`);
  if (inc1Details.status !== 'REJECTED' || negVaultPaused !== false || negProtStatus !== 'ACTIVE') {
    console.warn(`WARNING: Negative control outcome: status=${inc1Details.status}, paused=${negVaultPaused}, prot=${negProtStatus}`);
  }
  deploymentRecord.verification.negativeControl = {
    incidentId: incident1Id,
    status: inc1Details.status,
    recommendedAction: inc1Details.recommended_action,
    threatSeverity: inc1Details.threat_severity,
    vaultPaused: negVaultPaused,
    protectionStatus: negProtStatus,
  };

  // 5. Positive Control Incident
  console.log('\n[Stage 5/6] Executing Positive Control Incident (Exploit drain pattern, strong evidence)...');
  const posSubFees = await client.estimateTransactionFees();
  const posSubTxHash = await client.writeContract({
    address: haltAddress,
    functionName: 'submit_incident',
    args: [
      vaultAddress,
      'Critical recursive reentrancy drain exploit observed with unauthorized malicious vault withdrawal spike draining pool reserves',
      '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
      '',
    ],
    fees: posSubFees,
  });
  await waitForTx(posSubTxHash, 'Submit Positive Control Incident');
  deploymentRecord.transactions.submitPositiveIncident = posSubTxHash;

  const incident2Id = 'INC-2';
  console.log(`Adjudicating ${incident2Id}...`);
  const posAdjFees = await client.estimateTransactionFees();
  const posAdjTxHash = await client.writeContract({
    address: haltAddress,
    functionName: 'adjudicate_incident',
    args: [incident2Id],
    fees: posAdjFees,
  });
  await waitForTx(posAdjTxHash, 'Adjudicate Positive Control Incident');
  deploymentRecord.transactions.adjudicatePositiveIncident = posAdjTxHash;

  const inc2Details = await client.readContract({
    address: haltAddress,
    functionName: 'get_incident',
    args: [incident2Id],
  });
  const posVaultPaused = await client.readContract({
    address: vaultAddress,
    functionName: 'is_paused',
    args: [],
  });
  const posProtStatus = await client.readContract({
    address: haltAddress,
    functionName: 'get_protection_status',
    args: [vaultAddress],
  });
  console.log(`  * INC-2 Status             : ${inc2Details.status}`);
  console.log(`  * INC-2 Threat Severity    : ${inc2Details.threat_severity}`);
  console.log(`  * INC-2 Action             : ${inc2Details.recommended_action}`);
  console.log(`  * Post-Positive Vault Paused: ${posVaultPaused}`);
  console.log(`  * Post-Positive Prot Status: ${posProtStatus}`);
  deploymentRecord.verification.positiveControl = {
    incidentId: incident2Id,
    status: inc2Details.status,
    recommendedAction: inc2Details.recommended_action,
    threatSeverity: inc2Details.threat_severity,
    vaultPaused: posVaultPaused,
    protectionStatus: posProtStatus,
  };

  // 6. Save Artifacts
  console.log('\n[Stage 6/6] Writing Deployment Artifacts...');
  const artifactsDir = path.join(rootDir, 'artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  const outputPath = path.join(artifactsDir, 'deployment_studio_next.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(deploymentRecord, (k, v) => (typeof v === 'bigint' ? v.toString() : v), 2),
    'utf8'
  );
  console.log(`Deployment record saved to: ${outputPath}`);

  console.log('\n====================================================');
  console.log('      STUDIO NEXT DEPLOYMENT & VERIFICATION DONE    ');
  console.log('====================================================');
  console.log(`HaltLayer Contract : ${haltAddress}`);
  console.log(`DemoVault Contract : ${vaultAddress}`);
  console.log(`Explorer URL       : https://explorer-studio-dev.genlayer.com/`);
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('\nDeployment Failed:', err);
  process.exit(1);
});
