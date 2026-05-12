import { createClient } from "genlayer-js";
import { bradbury } from "../genlayer/wagmi-config";
import type { LeaderboardEntry, TransactionReceipt } from "./types";
import { createPublicClient, http } from "viem";

/**
 * Clean, robust RiddleMaster contract wrapper
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

    this.publicClient = createClient({
      chain: bradbury,
      endpoint: endpoint,
    });

    this.viemPublicClient = createPublicClient({
      chain: bradbury as any,
      transport: http(endpoint),
    });
  }

  /**
   * Fetch current riddle
   */
  async getCurrentRiddle(address: string): Promise<string> {
    try {
      const riddle = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_current_riddle",
        args: [address],
      });
      return String(riddle);
    } catch (error) {
      console.error("[RiddleMaster] Error fetching riddle:", error);
      return "";
    }
  }

  /**
   * Fetch player score
   */
  async getPlayerScore(address: string): Promise<number> {
    try {
      const score = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_score",
        args: [address],
      });
      return Number(score) || 0;
    } catch (error) {
      console.error("[RiddleMaster] Error fetching score:", error);
      return 0;
    }
  }

  /**
   * Fetch leaderboard
   */
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const leaderboardJson: any = await this.publicClient.readContract({
        address: this.contractAddress,
        functionName: "get_leaderboard",
        args: [],
      });

      const data = typeof leaderboardJson === 'string' ? JSON.parse(leaderboardJson) : leaderboardJson;

      return Object.entries(data as Record<string, number>)
        .map(([address, points]) => ({
          address,
          points: Number(points),
        }))
        .sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error("[RiddleMaster] Error fetching leaderboard:", error);
      return [];
    }
  }

  /**
   * Generate a new riddle (on-chain AI generation)
   */
  async generateRiddle(theme: string = ""): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "generate_riddle",
        args: ["new", theme],
        value: BigInt(0),
      });

      return await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 50,
        interval: 3000,
      }) as TransactionReceipt;
    } catch (error) {
      console.error("[RiddleMaster] Error generating riddle:", error);
      throw error;
    }
  }

  /**
   * Submit answer
   */
  async submitAnswer(userAnswer: string): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_answer",
        args: [userAnswer],
        value: BigInt(0),
      });

      return await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 50,
        interval: 3000,
      }) as TransactionReceipt;
    } catch (error) {
      console.error("[RiddleMaster] Error submitting answer:", error);
      throw error;
    }
  }

  /**
   * Get balance for pre-flight checks
   */
  async getAccountBalance(address: string): Promise<bigint> {
    return await this.viemPublicClient.getBalance({ address: address as `0x${string}` });
  }

  /**
   * Get gas price for pre-flight checks
   */
  async getGasPrice(): Promise<bigint> {
    return await this.viemPublicClient.getGasPrice();
  }
}

export default RiddleMaster;
