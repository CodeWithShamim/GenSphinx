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
    studioUrl?: string,
    provider?: any
  ) {
    this.contractAddress = contractAddress as `0x${string}`;

    const config: any = {
      chain: studionet,
    };

    if (address) {
      config.account = address as `0x${string}`;
      if (typeof window !== "undefined") {
        console.log(`[RiddleMaster] Initialized with account: ${address}`);
      }
    } else {
      if (typeof window !== "undefined") {
        console.log(`[RiddleMaster] Initialized without account (read-only)`);
      }
    }

    if (provider) {
      config.provider = provider;
      if (typeof window !== "undefined") {
        console.log(`[RiddleMaster] Using custom provider from wagmi/connector`);
      }
    }

    if (studioUrl) {
      config.endpoint = studioUrl;
      if (typeof window !== "undefined") {
        console.log(`[RiddleMaster] Using studio URL: ${studioUrl}`);
      }
    }

    this.client = createClient(config);
  }

  /**
   * Update the address used for transactions
   */
  updateAccount(address: string): void {
    console.log(`[RiddleMaster] Updating account to: ${address}`);
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
    try {
      // getBalance is a standard viem/genlayer-js public action
      return await this.client.getBalance({
        address: address as `0x${string}`,
      });
    } catch (error) {
      console.error("Error fetching balance:", error);
      try {
        // Fallback to raw RPC request
        const balanceHex = await (this.client as any).request({
          method: "eth_getBalance",
          params: [address, "latest"],
        });
        return BigInt(balanceHex);
      } catch (innerError) {
        console.error("Critical error fetching balance:", innerError);
        return BigInt(0);
      }
    }
  }

  /**
   * Estimate gas for generating a riddle
   */
  async estimateGenerateRiddleGas(): Promise<bigint> {
    try {
      // Try multiple possible method names for gas estimation
      const anyClient = this.client as any;
      if (typeof anyClient.estimateContractGas === "function") {
        return await anyClient.estimateContractGas({
          address: this.contractAddress,
          functionName: "generate_riddle",
          args: [],
        });
      } else if (typeof anyClient.estimateTransactionGas === "function") {
        return await anyClient.estimateTransactionGas({
          to: this.contractAddress,
        });
      }
      
      // GenLayer Studionet default for complex AI transactions
      return BigInt(1000000); 
    } catch (error) {
      console.error("Error estimating gas, using default:", error);
      return BigInt(1000000); 
    }
  }

  /**
   * Get the current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      if (typeof this.client.getGasPrice === "function") {
        return await this.client.getGasPrice();
      }
      
      const gasPriceHex = await (this.client as any).request({
        method: "eth_gasPrice",
      });
      return BigInt(gasPriceHex);
    } catch (error) {
      console.error("Error fetching gas price, using default:", error);
      // Default to 1 Gwei if everything fails
      return BigInt(1000000000);
    }
  }

  /**
   * Generate a new riddle
   */
  async generateRiddle(): Promise<TransactionReceipt> {
    try {
      console.log(`[RiddleMaster] Generating riddle...`);
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
      // Extract deeper error message if available
      const message = error.message || "Failed to generate riddle";
      const detailedError = error.data?.message || error.details || "";
      throw new Error(`${message}${detailedError ? `: ${detailedError}` : ""}`);
    }
  }
  /**
   * Submit an answer
   */
  async submitAnswer(userAnswer: string): Promise<TransactionReceipt> {
    try {
      console.log(`[RiddleMaster] Submitting answer: ${userAnswer}`);
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
      // Extract deeper error message if available
      const message = error.message || "Failed to submit answer";
      const detailedError = error.data?.message || error.details || "";
      throw new Error(`${message}${detailedError ? `: ${detailedError}` : ""}`);
    }
  }

}

export default RiddleMaster;
