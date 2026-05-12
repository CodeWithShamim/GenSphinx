"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import RiddleMaster from "../contracts/RiddleMaster";
import { getContractAddress, getRpcUrl } from "../genlayer/client";
import { useWallet } from "../genlayer/wallet";
import { success, error, configError } from "../utils/toast";
import type { LeaderboardEntry } from "../contracts/types";

export function useRiddleMasterContract(): RiddleMaster | null {
  const { address, provider } = useWallet();
  const contractAddress = getContractAddress();
  const rpcUrl = getRpcUrl();

  const contract = useMemo(() => {
    if (!contractAddress) {
      configError(
        "Setup Required",
        "Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file.",
      );
      return null;
    }
    if (typeof window !== "undefined") {
      console.log(
        `[useRiddleMaster] Creating contract instance for address: ${address}, hasProvider: ${!!provider}`,
      );
    }
    return new RiddleMaster(contractAddress, address, rpcUrl, provider);
  }, [contractAddress, address, rpcUrl, provider]);

  return contract;
}

export function useCurrentRiddle() {
  const contract = useRiddleMasterContract();
  const { address } = useWallet();

  return useQuery<string, Error>({
    queryKey: ["currentRiddle", address],
    queryFn: () => {
      if (!contract || !address) {
        return Promise.resolve("Please connect your wallet to see the riddle.");
      }
      return contract.getCurrentRiddle(address);
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract && !!address,
  });
}

export function usePlayerScore(address: string | null) {
  const contract = useRiddleMasterContract();

  return useQuery<number, Error>({
    queryKey: ["playerScore", address],
    queryFn: () => {
      if (!contract || !address) {
        return Promise.resolve(0);
      }
      return contract.getPlayerScore(address);
    },
    refetchOnWindowFocus: true,
    enabled: !!address && !!contract,
    staleTime: 2000,
  });
}

export function useLeaderboard() {
  const contract = useRiddleMasterContract();

  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => {
      if (!contract) {
        return Promise.resolve([]);
      }
      return contract.getLeaderboard();
    },
    refetchOnWindowFocus: true,
    staleTime: 2000,
    enabled: !!contract,
  });
}

export function useGenerateRiddle() {
  const contract = useRiddleMasterContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const mutation = useMutation({
    mutationFn: async (theme: string = "") => {
      if (!contract || !address) {
        throw new Error("Contract not configured or wallet not connected.");
      }
      setIsGenerating(true);

      try {
        // Now entirely on-chain!
        return await contract.generateRiddle(theme);
      } catch (err: any) {
        setIsGenerating(false);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentRiddle"] });
      setIsGenerating(false);
      success("New riddle generated!");
    },
    onError: (err: any) => {
      console.error("Error generating riddle:", err);
      setIsGenerating(false);
      error("Failed to generate riddle", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isGenerating,
    generateRiddle: mutation.mutate,
    generateRiddleAsync: mutation.mutateAsync,
  };
}

export function useSubmitAnswer() {
  const contract = useRiddleMasterContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mutation = useMutation({
    mutationFn: async (userAnswer: string) => {
      if (!contract || !address) {
        throw new Error("Contract not configured or wallet not connected.");
      }
      setIsSubmitting(true);

      try {
        // Pre-flight check: gas and balance
        let balance = BigInt(-1); // -1 means unknown
        let gasPrice = BigInt(1000000000);

        try {
          const [fetchedBalance, fetchedGasPrice] = await Promise.all([
            contract.getAccountBalance(address),
            contract.getGasPrice(),
          ]);
          balance = fetchedBalance;
          gasPrice = fetchedGasPrice;
        } catch (checkErr) {
          console.warn(
            "[useSubmitAnswer] Pre-flight check failed, proceeding anyway:",
            checkErr,
          );
        }

        if (balance === BigInt(0)) {
          throw new Error(
            "Insufficient funds. Your balance is 0 GEN on Bradbury. Faucet: https://faucet.genlayer.com",
          );
        }

        // Estimate gas for submit_answer
        // We can use a generic estimate or a fixed safe value for this check
        const gasEstimate = BigInt(500000);
        const totalCost = gasEstimate * gasPrice;

        if (balance !== BigInt(-1) && balance < totalCost) {
          const balanceGen = Number(balance) / 1e18;
          throw new Error(
            `Insufficient funds for gas on Bradbury. Balance: ${balanceGen.toFixed(4)} GEN. Faucet: https://faucet.genlayer.com`,
          );
        }

        return await contract.submitAnswer(userAnswer);
      } catch (err: any) {
        setIsSubmitting(false);
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentRiddle"] });
      queryClient.invalidateQueries({ queryKey: ["playerScore"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      setIsSubmitting(false);
      success("Answer submitted!");
    },
    onError: (err: any) => {
      console.error("Error submitting answer:", err);
      setIsSubmitting(false);
      error("Failed to submit answer", {
        description: err?.message || "Please try again.",
      });
    },
  });

  return {
    ...mutation,
    isSubmitting,
    submitAnswer: mutation.mutate,
    submitAnswerAsync: mutation.mutateAsync,
  };
}
