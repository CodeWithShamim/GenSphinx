import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { LeaderboardEntry, TransactionReceipt } from "./types";

/**
 * RiddleMaster contract class for interacting with the GenLayer Riddle Master contract
 */
class RiddleMaster {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(
    contractAddress: string,
    address?: string | null,
    studioUrl?: string
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
    }

    this.client = createClient(config);
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    const config: any = {
      chain: studionet,
      account: address as `0x${string}`,
    };

    this.client = createClient(config);
  }

  /**
   * Get the current riddle for a player
   */
  async getCurrentRiddle(address: string | null): Promise<string> {
    if (!address) return "Please connect your wallet.";
    try {
      const riddle = await this.client.readContract({
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
      const score = await this.client.readContract({
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
      const leaderboard: any = await this.client.readContract({
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

      return [];
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  /**
   * Generate a new riddle
   */
  async generateRiddle(): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "generate_riddle",
        args: [],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error generating riddle:", error);
      throw new Error("Failed to generate riddle");
    }
  }

  /**
   * Submit an answer
   */
  async submitAnswer(userAnswer: string): Promise<TransactionReceipt> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "submit_answer",
        args: [userAnswer],
        value: BigInt(0),
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 24,
        interval: 5000,
      });

      return receipt as TransactionReceipt;
    } catch (error) {
      console.error("Error submitting answer:", error);
      throw new Error("Failed to submit answer");
    }
  }
}

export default RiddleMaster;
