import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  TransactionHash,
  TransactionStatus,
  GenLayerClient,
  DecodedDeployData,
  GenLayerChain,
} from "genlayer-js/types";
import { localnet } from "genlayer-js/chains";

export default async function main(client: GenLayerClient<any>) {
  const filePath = path.resolve(process.cwd(), "contracts/riddle_master.py");

  try {
    const contractCode = new Uint8Array(readFileSync(filePath));

    await client.initializeConsensusSmartContract();

    const deployTransaction = await client.deployContract({
      code: contractCode,
      args: [],
    });

    const receipt = await client.waitForTransactionReceipt({
      hash: deployTransaction as TransactionHash,
      status: TransactionStatus.ACCEPTED,
      retries: 200,
    });

    if (
      receipt.status !== 5 &&
      receipt.status !== 6 &&
      receipt.statusName !== "ACCEPTED" &&
      receipt.statusName !== "FINALIZED"
    ) {
      throw new Error(`Deployment failed. Receipt: ${JSON.stringify(receipt)}`);
    }

    const deployedContractAddress =
      (client.chain as GenLayerChain).id === localnet.id
        ? receipt.data.contract_address
        : (receipt.txDataDecoded as DecodedDeployData)?.contractAddress;

    console.log(`Contract deployed at address: ${deployedContractAddress}`);

    // Update frontend/.env
    const envPath = path.resolve(process.cwd(), "frontend/.env");
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, "utf8");
      const regex = /^NEXT_PUBLIC_CONTRACT_ADDRESS=.*$/m;
      if (regex.test(envContent)) {
        envContent = envContent.replace(
          regex,
          `NEXT_PUBLIC_CONTRACT_ADDRESS=${deployedContractAddress}`
        );
      } else {
        envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS=${deployedContractAddress}\n`;
      }
      writeFileSync(envPath, envContent);
      console.log(`Updated ${envPath} with new contract address.`);
    } else {
      console.log(
        `Warning: ${envPath} not found. Please update it manually with address: ${deployedContractAddress}`
      );
    }
  } catch (error) {
    throw new Error(`Error during deployment:, ${error}`);
  }
}
