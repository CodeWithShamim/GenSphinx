import { createClient } from "genlayer-js";
import { bradbury } from "../genlayer/wagmi-config";
import type { LeaderboardEntry, TransactionReceipt } from "./types";
import { createPublicClient, http, type PublicClient as ViemPublicClient } from "viem";

/**
 * RiddleMaster contract class for interacting with the GenLayer Riddle Master contract
 */
class RiddleMaster {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;
  private publicClient: ReturnType<typeof createClient>;
  private viemPublicClient: ViemPublicClient;

  constructor(
    contractAddress: string,
    address?: string | null,
    rpcUrl?: string,
    provider?: any
  ) {
    this.contractAddress = contractAddress as `0x${string}`;
    const endpoint = rpcUrl || "https://rpc-bradbury.genlayer.com";

    const config: any = {
      chain: bradbury,
      endpoint: endpoint,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (provider) {
      config.provider = provider;
    }

    this.client = createClient(config);

    // Dedicated public client for GenLayer-specific calls (gen_call)
    const publicConfig: any = {
      chain: bradbury,
      endpoint: endpoint,
    };
    this.publicClient = createClient(publicConfig);

    // Standard Viem public client for reliable balance and gas price (ALWAYS hits RPC)
    this.viemPublicClient = createPublicClient({
      chain: bradbury,
      transport: http(endpoint),
    });

    if (typeof window !== "undefined") {
      console.log(`[RiddleMaster] Initialized. Account: ${address || 'None'}, RPC: ${endpoint}`);
    }
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    console.log(`[RiddleMaster] Updating account to: ${address}`);
    
    // Get the endpoint from the current client if possible
    const currentEndpoint = (this.viemPublicClient as any).chain?.rpcUrls?.default?.http[0] || "https://rpc-bradbury.genlayer.com";
    
    const config: any = {
      chain: bradbury,
      account: address as `0x${string}`,
      endpoint: currentEndpoint,
    };
    
    this.client = createClient(config);
  }

  /**
   * Get the current riddle for a player
   */
  async getCurrentRiddle(address: string | null): Promise<string> {
    if (!address) return "Please connect your wallet.";
    try {
      const riddle = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_current_riddle",
        args: [address],
      });
      return String(riddle);
    } catch (error) {
      console.error("Error fetching riddle:", error);
      return "No riddle generated yet.";
    }
  }

  /**
   * Get points for a specific player
   */
  async getPlayerScore(address: string | null): Promise<number> {
    if (!address) return 0;
    try {
      const score = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_score",
        args: [address],
      });
      return Number(score) || 0;
    } catch (error) {
      console.error("Error fetching player score:", error);
      return 0;
    }
  }

  /**
   * Get the leaderboard
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const leaderboard: any = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_leaderboard",
        args: [],
      });

      if (leaderboard instanceof Map) {
        return Array.from(leaderboard.entries())
          .map(([address, points]: any) => ({
            address,
            points: Number(points),
          }))
          .sort((a, b) => b.points - a.points);
      }

      if (typeof leaderboard === "object" && leaderboard !== null) {
        return Object.entries(leaderboard)
          .map(([address, points]: any) => ({
            address,
            points: Number(points),
          }))
          .sort((a, b) => b.points - a.points);
      }

      return [];
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  /**
   * Get the current balance of an account in Wei
   */
  async getAccountBalance(address: string): Promise<bigint> {
    const rpcUrl = (this.viemPublicClient as any).chain?.rpcUrls?.default?.http[0];
    console.log(`[RiddleMaster] Fetching balance for ${address} on Bradbury RPC (Viem): ${rpcUrl}`);
    try {
      // Use viemPublicClient to ensure we hit Bradbury RPC, NOT MetaMask's current network
      const balance = await this.viemPublicClient.getBalance({
        address: address as `0x${string}`,
      });
      console.log(`[RiddleMaster] Balance retrieved: ${balance.toString()} Wei`);
      return balance;
    } catch (error: any) {
      console.error("[RiddleMaster] Error fetching balance via Viem:", error);
      const errorMessage = error?.message || "Unknown error";
      throw new Error(`Unable to fetch balance from Bradbury network (${rpcUrl}): ${errorMessage}. Please check your connection.`);
    }
  }

  /**
   * Get the current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const gasPrice = await this.viemPublicClient.getGasPrice();
      console.log(`[RiddleMaster] Gas price from Bradbury: ${gasPrice.toString()} Wei`);
      return gasPrice;
    } catch (error) {
      console.error("[RiddleMaster] Error fetching gas price from Bradbury:", error);
      return BigInt(1000000000);
    }
  }

  /**
   * Estimate gas for generating a riddle
   */
  async estimateGenerateRiddleGas(): Promise<bigint> {
    try {
      // We use a safe default for Bradbury
      return BigInt(1000000); 
    } catch (error) {
      console.error("[RiddleMaster] Error estimating gas on Bradbury:", error);
      return BigInt(1000000); 
    }
  }

  /**
   * Generate a new riddle
   */
  async generateRiddle(): Promise<TransactionReceipt> {
    try {
      console.log(`[RiddleMaster] Generating riddle...`);
      
      // Ensure the client is initialized before sending transaction
      // This fixes a race condition in genlayer-js where it fetches the consensus contract in the background
      if (this.client.initializeConsensusSmartContract) {
        await this.client.initializeConsensusSmartContract();
      }

      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "generate_riddle",
        args: [],
        value: BigInt(0),
      });
      console.log(`[RiddleMaster] Transaction sent: ${txHash}`);

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      console.log(`[RiddleMaster] Transaction receipt:`, receipt);

      // Check for success statuses: ACCEPTED (5) or FINALIZED (7)
      const isSuccessful = 
        receipt.status === 5 || 
        receipt.status === 7 || 
        receipt.statusName === ("ACCEPTED" as any) || 
        receipt.statusName === ("FINALIZED" as any);

      if (!isSuccessful) {
        throw new Error(`Transaction not accepted by consensus. Status: ${receipt.statusName} (${receipt.status}). Hash: ${txHash}`);
      }

      return receipt as TransactionReceipt;
    } catch (error: any) {
      console.error("Error generating riddle:", error);
      let errorMessage = error?.message || "Failed to generate riddle";
      
      // Handle various error formats from genlayer-js/viem
      const details = error?.data?.message || error?.details || error?.reason;
      if (details && typeof details === 'string') {
        errorMessage += `: ${details}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Submit an answer
   */
  async submitAnswer(userAnswer: string): Promise<TransactionReceipt> {
    try {
      console.log(`[RiddleMaster] Submitting answer: ${userAnswer}`);

      // Ensure the client is initialized before sending transaction
      if (this.client.initializeConsensusSmartContract) {
        await this.client.initializeConsensusSmartContract();
      }

      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_answer",
        args: [userAnswer],
        value: BigInt(0),
      });
      console.log(`[RiddleMaster] Transaction sent: ${txHash}`);

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      console.log(`[RiddleMaster] Transaction receipt:`, receipt);

      // Check for success statuses: ACCEPTED (5) or FINALIZED (7)
      const isSuccessful = 
        receipt.status === 5 || 
        receipt.status === 7 || 
        receipt.statusName === ("ACCEPTED" as any) || 
        receipt.statusName === ("FINALIZED" as any);

      if (!isSuccessful) {
        throw new Error(`Transaction not accepted by consensus. Status: ${receipt.statusName} (${receipt.status}). Hash: ${txHash}`);
      }

      return receipt as TransactionReceipt;
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      let errorMessage = error?.message || "Failed to submit answer";
      
      const details = error?.data?.message || error?.details || error?.reason;
      if (details && typeof details === 'string') {
        errorMessage += `: ${details}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  /**
   * Check if a player has an active riddle
   */
  async hasActiveRiddle(address: string): Promise<boolean> {
    try {
      const result = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "has_active_riddle",
        args: [address],
      });
      return Boolean(result);
    } catch (error) {
      console.error("Error checking active riddle:", error);
      return false;
    }
  }
}

export default RiddleMaster;
