import { createClient } from "genlayer-js";
import { bradbury } from "../genlayer/wagmi-config";
import type { LeaderboardEntry, TransactionReceipt } from "./types";
import { createPublicClient, http } from "viem";

/**
 * RiddleMaster contract class for interacting with the GenLayer Riddle Master contract
 */
class RiddleMaster {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;
  private publicClient: ReturnType<typeof createClient>;
  private viemPublicClient: any;

  constructor(
    contractAddress: string,
    address?: string | null,
    rpcUrl?: string,
    provider?: any
  ) {
    this.contractAddress = contractAddress as `0x${string}`;
    const endpoint = rpcUrl || "https://rpc-bradbury.genlayer.com";

    // Configuration for genlayer-js client
    // Note: genlayer-js uses 'provider' for wallet integration (MetaMask)
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

    // Standard Viem public client for reliable balance and gas price
    this.viemPublicClient = createPublicClient({
      chain: bradbury as any,
      transport: http(endpoint),
    });

    if (typeof window !== "undefined") {
      console.log(`[RiddleMaster] Initialized. Account: ${address || 'None'}, RPC: ${endpoint}, HasProvider: ${!!provider}`);
    }
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string, provider?: any): void {
    console.log(`[RiddleMaster] Updating account to: ${address}`);
    
    const currentEndpoint = (this.viemPublicClient as any).chain?.rpcUrls?.default?.http[0] || "https://rpc-bradbury.genlayer.com";
    
    const config: any = {
      chain: bradbury,
      account: address as `0x${string}`,
      endpoint: currentEndpoint,
    };

    if (provider) {
      config.provider = provider;
    }
    
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
      const leaderboardJson: any = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_leaderboard",
        args: [],
      });

      let data: Record<string, number> = {};
      try {
        data = typeof leaderboardJson === 'string' ? JSON.parse(leaderboardJson) : leaderboardJson;
      } catch (e) {
        console.error("Error parsing leaderboard JSON:", e);
        return [];
      }

      return Object.entries(data)
        .map(([address, points]) => ({
          address,
          points: Number(points),
        }))
        .sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  /**
   * Get the current balance of an account in Wei
   */
  async getAccountBalance(address: string): Promise<bigint> {
    try {
      const balance = await this.viemPublicClient.getBalance({
        address: address as `0x${string}`,
      });
      return balance;
    } catch (err: any) {
      console.error("[RiddleMaster] Error fetching balance:", err);
      return BigInt(0);
    }
  }

  /**
   * Get the current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      return await this.viemPublicClient.getGasPrice();
    } catch (_) {
      return BigInt(1000000000);
    }
  }

  /**
   * Estimate gas for generating a riddle
   */
  async estimateGenerateRiddleGas(): Promise<bigint> {
    return BigInt(1000000); 
  }

  /**
   * Generate a new riddle
   */
  async generateRiddle(): Promise<TransactionReceipt> {
    try {
      console.log(`[RiddleMaster] Generating riddle...`);
      
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

      return receipt as TransactionReceipt;
    } catch (error: any) {
      console.error("Error generating riddle:", error);
      throw error;
    }
  }

  /**
   * Submit an answer
   */
  async submitAnswer(userAnswer: string): Promise<TransactionReceipt> {
    try {
      console.log(`[RiddleMaster] Submitting answer: ${userAnswer}`);

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

      return receipt as TransactionReceipt;
    } catch (error: any) {
      console.error("Error submitting answer:", error);
      throw error;
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
