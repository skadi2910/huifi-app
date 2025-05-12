"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Coins,
  Trophy,
  Zap,
  CheckCircle,
  Wallet,
  AlertTriangle,
  Info,
  Users,
  Clock,
  TrendingUp,
  Shield,
  History,
  ArrowRight,
} from "lucide-react";
import {
  useHuifiPools,
  PoolWithKey,
  MemberAccountData,
} from "@/hooks/useHuifiPools";
import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getStatusString,
  formatDurationHours,
  lamportsToSol,
  bpsToPercentage,
  getPhaseString,
} from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useContributeSol } from "@/hooks/useContributeSol";
import { toast } from "react-hot-toast";
import { useAdvanceCycle } from "@/hooks/useAdvanceCycle";
import { usePoolBidding } from "@/hooks/usePoolBidding";
import { useClaimPayout } from "@/hooks/useClaimPayout";
import { PoolStatusWithPhase } from "@/lib/types/program-types";
import { useDepositCollateral } from "@/hooks/useDepositCollateral";
// Assuming MOCK_POOL_DATA is either passed in or replaced by actual data structure
// If MOCK_POOL_DATA is truly static, you might keep its definition here or import it.
// If it represents the *structure* of the fetched data, use the actual data passed in props.
// For this example, I'll assume the structure is similar to MOCK_POOL_DATA and use the prop `initialData`.
// import { MOCK_POOL_DATA } from './mockData'; // Or wherever it's defined

// Import any client-side hooks you might need for actions
// import { useHuifiPools } from '@/hooks/useHuifiPools';

// Define the expected structure of the pool data you fetch server-side
// Replace 'any' with a more specific type if available (e.g., HuifiPool)
interface PoolData {
  id: string;
  status: string;
  totalValue: string;
  participants: { current: number; max: number };
  rounds: { current: number; total: number };
  dates: {
    created: string;
    started: string;
    nextPayout: string;
    estimatedEnd: string;
  };
  financials: {
    contributionAmount: string;
    totalContributed: string;
    yieldEarned: string;
    apy: string;
    earlyWithdrawalFee: string;
  };
  timing: { frequency: string; nextPayoutIn: string; roundDuration: string };
  user: {
    position: number;
    roundsToWait: number;
    contributed: string;
    earned: string;
    status: string;
  };
  stats: {
    totalMembers: number;
    totalPayouts: string;
    averageYield: string;
    completedRounds: number;
  };
  security: {
    contract: string;
    creator: string;
    verified: boolean;
    audited: boolean;
  };
  history: {
    date: string;
    type: string;
    amount?: string;
    recipient?: string;
    creator?: string;
  }[];
  // Add any other fields your actual data might have
}

// Define props including the fetched data and publicKey
interface PoolDetailComponentProps {
  initialData: PoolData | null; // Allow null if fetching might fail
  publicKey: string;
}

type ActionConfig = {
  title: string;
  description: string;
  buttonText: string;
  min?: string;
  max?: string;
};
// Helper function to get status string
// const getStatusString = (status: any): string => {
//   // Check if status exists
//   if (!status) return 'Unknown';

//   // Check which key exists in the status object
//   try {
//     if ('initializing' in status) return 'Initializing';
//     if ('active' in status) return 'Active';
//     if ('completed' in status) return 'Completed';
//     return 'Unknown'; // fallback
//   } catch (error) {
//     console.error('Error parsing status:', status);
//     return 'Unknown';
//   }
// };
// const formatDurationHours = (cycleDurationSeconds: BN): string => {
//   const seconds = Number(cycleDurationSeconds.toString());
//   const hours = seconds / 3600;
//   return `${Math.floor(hours)} hours`;
// };
export const PoolDetailComponent: React.FC<PoolDetailComponentProps> = ({
  initialData,
  publicKey,
}) => {
  const router = useRouter();
  const { publicKey: userWallet } = useWallet();
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [actionAmount, setActionAmount] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [poolData, setPoolData] = useState<PoolWithKey | null>(null);
  const [memberDetails, setMemberDetails] = useState<MemberAccountData | null>(
    null
  );
  const { fetchPoolDetails, fetchMemberAccountDetail } = useHuifiPools();
  const poolPublicKey = useMemo(() => new PublicKey(publicKey), [publicKey]);
  const [statusString, setStatusString] = useState<string>("Unknown");
  const [currentPhase, setCurrentPhase] = useState<string>("Unknown");
  const { contributeSolMutation } = useContributeSol();
  const { advanceCycleMutation } = useAdvanceCycle({
    pool: poolData as PoolWithKey,
  });
  const { placeBidMutation } = usePoolBidding(poolPublicKey);
  const { claimPayoutMutation } = useClaimPayout(poolPublicKey);
  const { depositSolCollateralMutation } = useDepositCollateral(poolPublicKey);
  // To multiply by 1.3:
  const multiplier = new BN(13);
  const divisor = new BN(10);
  useEffect(() => {
    const loadPoolData = async () => {
      try {
        const data = await fetchPoolDetails(poolPublicKey);
        setPoolData(data);
        console.log("Pool data:", data);
        // Handle status and phase
        const status = data?.account.status as unknown as PoolStatusWithPhase;
        const statusString = getStatusString(status);
        // First check if the status object exists
        setStatusString(statusString);
        if (statusString === "Active") {
          const currentPhase = status.active?.phase;
          console.log("Current phase:", currentPhase);
          setCurrentPhase(getPhaseString(currentPhase));
        }
        // setCurrentPhase(phase);
      } catch (error) {
        console.error("Error fetching pool details:", error);
        // setStatusString("Unknown");
        setCurrentPhase("Unknown");
      }
    };
  
    loadPoolData();
  }, [poolPublicKey, fetchPoolDetails]);
  useEffect(() => {
    // Extract the check into a variable to satisfy the static checker
    const isReady = poolData && userWallet;
    const checkMembership = async () => {
      if (!isReady) {
        console.log("Missing required data for membership check:", {
          hasPoolData: !!poolData,
          hasUserWallet: !!userWallet,
        });
        return;
      }

      try {
        // console.log('Checking membership for:', {
        //   pool: poolData.publicKey.toString(),
        //   user: userWallet.toString()
        // });

        const memberDetails = await fetchMemberAccountDetail(
          poolData,
          userWallet
        );

        if (memberDetails) {
          console.log("Member details:", memberDetails);
          // console.log('Member details:', {
          //   owner: memberDetails.owner.toString(),
          //   pool: memberDetails.pool.toString(),
          //   contributionsMade: memberDetails.contributionsMade,
          //   hasContributed: memberDetails.hasContributed,
          //   hasReceivedPayout: memberDetails.hasReceivedPayout,
          //   eligibleForPayout: memberDetails.eligibleForPayout,
          //   collateralStaked: memberDetails.collateralStaked.toString(),
          //   status: memberDetails.status
          // });
          setMemberDetails(memberDetails);
        } else {
          console.log("User is not a member of this pool");
          toast.error("User is not a member of this pool");
          setMemberDetails(null);
        }
      } catch (error) {
        console.error("Error checking membership:", error);
        setMemberDetails(null);
      }
    };

    checkMembership();
  }, [poolData, userWallet, fetchMemberAccountDetail]); // Client-side hooks for actions (example)
  // const { someActionFromHook } = useHuifiPools();

  // Check if the current user is the creator of the pool
  const isPoolCreator = useMemo(() => {
    if (!poolData || !userWallet) return false;
    return poolData.account.creator.toString() === userWallet.toString();
  }, [poolData, userWallet]);

  // Update the handle action function to include progress functionality
  const handleAction = async (amount: string) => {
    console.log(`Performing action: ${activeAction} with amount: ${amount}`);
    setIsProcessing(true);

    try {
      switch (activeAction) {
        case "contribute":
          if (!poolData) throw new Error("Pool data not found");
          if (!amount || parseFloat(amount) <= 0) {
            throw new Error("Please enter a valid amount");
          }

          await contributeSolMutation.mutateAsync({
            poolId: poolPublicKey,
            uuid: poolData.account.uuid || [],
            amount: parseFloat(amount),
          });
          toast.success("Successfully contributed to the pool!");
          break;

        case "bid":
          if (!poolData) throw new Error("Pool data not found");
          await placeBidMutation.mutateAsync({
            amount: parseFloat(amount),
            uuid: poolData.account.uuid,
          });
          toast.success("Successfully placed a bid!");
          break;

        case "progress":
          if (!isPoolCreator) {
            throw new Error("Only the pool creator can progress the pool");
          }
          await advanceCycleMutation.mutateAsync({
            pool: poolData as PoolWithKey,
          });
          toast.success("Successfully progressed the pool to the next phase!");
          break;
        case "claim":
          if (!poolData) throw new Error("Pool data not found");
          await claimPayoutMutation.mutateAsync({
            // amount: parseFloat(amount),
            uuid: poolData.account.uuid,
          });
          toast.success("Successfully claim payout!");
          break;
        case "withdraw":
          break;
      }

      // Refresh pool data after successful action
      const data = await fetchPoolDetails(poolPublicKey);
      setPoolData(data);
      if (activeAction === "progress") {
        setStatusString(getStatusString(data?.account.status));
      }
    } catch (error) {
      console.log("Error caught:", error);
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";
      console.log("Error message:", errorMessage);
      // The error message will now come properly formatted from the hook
      // toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      // Force toast with promise
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
      setActionAmount("");
    }
  };

  // Action modal component
  const ActionModal = () => {
    const [localActionAmount, setLocalActionAmount] = useState<string>("");
    if (!activeAction || !poolData) return null;
    const handleLocalAction = async () => {
      // Update parent state only when submitting
      setActionAmount(localActionAmount);
      console.log("localActionAmount: ", localActionAmount);
      await handleAction(localActionAmount);
    };
    const handleCollateralAction = async () => {
      // Update parent state only when submitting
      setActionAmount(localActionAmount);
      // console.log("localActionAmount: ", localActionAmount);
      //
      try {
        if (!poolData) throw new Error("Pool data not found");
        if (!localActionAmount || parseFloat(localActionAmount) <= 0) {
          throw new Error("Please enter a valid amount");
        }
        await depositSolCollateralMutation.mutateAsync({
          amount: parseFloat(localActionAmount),
          uuid: poolData.account.uuid,
        });
        toast.success("Successfully deposited collateral!");
      } catch (error) {
        console.log("Error caught:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        console.log("Error message:", errorMessage);
        // The error message will now come properly formatted from the hook
        // toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
        // Force toast with promise
        toast.error(errorMessage);
      } finally {
        setIsProcessing(false);
        setActiveAction(null);
        setActionAmount("");
      }
    };
    // Use `data` (from props) instead of MOCK_POOL_DATA here
    const actionConfig: Record<string, ActionConfig> = {
      bid: {
        title: "Place Bid for Next Round",
        description:
          "Increase your chances of winning by placing a competitive bid.", // TODO: Get actual highest bid if available
        buttonText: "Place Bid",
        min: poolData?.account.config.isNativeSol ? "0.0005 SOL" : "1 USDC", // Example values
        max: poolData?.account.config.isNativeSol ? "0.005 SOL" : "500 USDC",
      },
      contribute: {
        title: "Contribute to Pool",
        // description: `Contribution amount: ${data.financials.contributionAmount}`, // Use actual data
        description: `Contribution amount: ${lamportsToSol(
          new BN(poolData?.account.finalContributionAmount ?? 0)
        ).toString()}`,
        buttonText: "Contribute",
        // Assuming contribution amount is fixed based on data, min/max might not apply
        // min: data.financials.contributionAmount,
        // max: data.financials.contributionAmount,
      },
      withdraw: {
        title: "Withdraw Funds",
        // description: `Available for withdrawal: ${poolData.account.user.contributed}\nEarly withdrawal fee: ${poolData.account.financials.earlyWithdrawalFee}`, // Use actual data
        description: `Available for withdrawal: `, // Use actual data
        buttonText: "Withdraw",
      },
      claim: {
        title: "Claim Payout",
        description: `Available to claim: ${lamportsToSol(
          poolData.account.totalContributions
        ).toString()}\nCollateral: ${lamportsToSol(
          poolData.account.totalContributions.mul(multiplier).div(divisor)
        ).toString()}`, // Use actual data
        buttonText: "Claim Payout",
      },
      progress: {
        title: "Progress Pool",
        description:
          "Progress the pool to the next round. This will trigger the next payout and update the pool status. Only available to the pool creator.",
        buttonText: "Progress Pool",
      },
    };

    const config = actionConfig[activeAction as keyof typeof actionConfig];
    if (!config) return null; // Handle case where action doesn't exist

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a18] rounded-xl p-6 max-w-md w-full border border-[#e6ce04]/30 shadow-lg">
          <h3 className="text-xl font-bold text-[#e6ce04] mb-2">
            {config.title}
          </h3>
          <p className="text-[#f8e555]/70 mb-4 whitespace-pre-line">
            {config.description}
          </p>

          {(activeAction === "bid" ||
            activeAction === "contribute" ||
            activeAction === "claim") && ( // Adjust condition if 'contribute' takes amount input
            <div className="space-y-4 mb-4">
              <input
                type="text"
                value={localActionAmount}
                // onChange={(e) => setLocalActionAmount(e.target.value)}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty string, numbers, and only one decimal point
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    // Prevent multiple decimal points
                    if (value.split(".").length <= 2) {
                      setLocalActionAmount(value);
                    }
                  }
                }}
                placeholder={
                  activeAction === "claim"
                    ? "Enter Collateral To Claim"
                    : poolData.account.config.isNativeSol
                    ? "Enter amount in SOL"
                    : "Enter amount in USDC"
                }
                className="w-full px-4 py-2 bg-[#010200] border-2 border-[#e6ce04]/30 rounded-lg text-[#e6ce04] focus:border-[#e6ce04] focus:ring-0"
              />
              {config.min && config.max && (
                <div className="flex justify-between text-sm text-[#f8e555]/70">
                  <span>Min: {config.min}</span>
                  <span>Max: {config.max}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            {activeAction === "claim" ? (
              <button
                onClick={handleCollateralAction}
                disabled={isProcessing}
                className="flex-1 bg-[#e6ce04] text-[#010200] font-bold py-2 rounded-lg hover:bg-[#f8e555] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? "Processing..." : "Put Collateral"}
              </button>
            ) : (
              <span></span>
            )}
            <button
              onClick={handleLocalAction}
              disabled={
                isProcessing ||
                ((activeAction === "bid" || activeAction === "contribute") &&
                  !localActionAmount)
              } // Basic validation
              className="flex-1 bg-[#e6ce04] text-[#010200] font-bold py-2 rounded-lg hover:bg-[#f8e555] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : config.buttonText}
            </button>
            <button
              onClick={() => setActiveAction(null)}
              disabled={isProcessing}
              className="px-4 py-2 border border-[#e6ce04]/30 rounded-lg text-[#e6ce04] hover:bg-[#1a1a18]/50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render loading state or message if data hasn't loaded (though it should be passed initially)
  if (!poolData) {
    return (
      <main className="min-h-screen pt-4 pb-16 bg-[#010200] flex items-center justify-center">
        <p className="text-[#e6ce04]">Loading pool details...</p>
        {/* Or a more sophisticated loading spinner */}
      </main>
    );
  }

  // Render the main UI using 'data'
  return (
    <main className="min-h-screen pt-4 pb-16 bg-[#010200]">
      <ActionModal />

      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.push("/app/pools")} // Use router from hook
            className="mr-4 p-2 rounded-full hover:bg-[#1a1a18] text-[#e6ce04]"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#e6ce04] rounded-full flex items-center justify-center">
                <Coins className="w-6 h-6 text-[#010200]" />
              </div>
              <div>
                {/* Use dynamic data */}
                <h1 className="text-2xl md:text-3xl font-bold text-[#e6ce04] break-all">
                  HuiFi Pool #{publicKey.substring(0, 6)}
                </h1>
                {/* Use dynamic data */}
                <p className="text-[#f8e555]/70 text-sm md:text-base">
                  Created by{poolData.account.creator.toString()}
                </p>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-[#1a1a18] px-4 py-2 rounded-lg border border-[#e6ce04]/20">
              <p className="text-[#f8e555]/70 mr-2">
                {" "}
                Pool Status: 
                {/* Use dynamic data */}
                <span className="text-[#e6ce04] font-bold text-end">
                  {statusString.toUpperCase()}
                </span>
              </p>
              <p>
                {" "}
                <span className="text-[#f8e555]/70 mr-2">Current Phase:</span>
                {/* Use dynamic data */}
                <span className="text-[#e6ce04] font-bold">
                  {currentPhase.toUpperCase()}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid - Use dynamic data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
                <p className="text-[#f8e555]/70 text-sm md:text-base mb-1">
                  Total Value
                </p>
                <p className="text-xl md:text-2xl font-bold text-[#e6ce04]">
                  {lamportsToSol(
                    poolData.account.totalContributions
                  ).toString()}
                </p>
              </div>
              <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
                <p className="text-[#f8e555]/70 text-sm md:text-base mb-1">
                  APY
                </p>
                <p className="text-xl md:text-2xl font-bold text-[#e6ce04]">
                  {"5%"}
                </p>
              </div>
              <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
                <p className="text-[#f8e555]/70 text-sm md:text-base mb-1">
                  Members
                </p>
                <p className="text-xl md:text-2xl font-bold text-[#e6ce04]">
                  {`${poolData.account.memberAddresses.length}/${poolData.account.config.maxParticipants}`}
                </p>
              </div>
              <div className="bg-[#1a1a18] p-4 rounded-xl border border-[#e6ce04]/20">
                <p className="text-[#f8e555]/70 text-sm md:text-base mb-1">
                  Round
                </p>
                <p className="text-xl md:text-2xl font-bold text-[#e6ce04]">
                  {`${poolData.account.currentCycle}/${poolData.account.totalCycles}`}
                </p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-[#1a1a18] rounded-xl border border-[#e6ce04]/20">
              {/* Tab Navigation */}
              <div className="border-b border-[#e6ce04]/20">
                <nav
                  className="flex space-x-1 sm:space-x-4 px-2 sm:px-4 overflow-x-auto"
                  aria-label="Tabs"
                >
                  {["overview", "members", "history", "details"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)} // Use state setter
                      className={`py-3 px-2 sm:px-4 text-sm md:text-base font-medium border-b-2 whitespace-nowrap ${
                        activeTab === tab // Use state variable
                          ? "border-[#e6ce04] text-[#e6ce04]"
                          : "border-transparent text-[#f8e555]/70 hover:text-[#e6ce04]"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4 md:p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Pool Info & Financials */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg md:text-xl font-medium text-[#e6ce04] mb-3">
                          Pool Information
                        </h3>
                        <div className="space-y-3 text-sm md:text-base">
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">Status</span>
                            <span className="text-[#e6ce04]">
                              {statusString.toUpperCase()}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">Frequency</span>
                            <span className="text-[#e6ce04]">
                              {poolData.account.frequency.toUpperCase()}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">
                              Round Duration
                            </span>
                            <span className="text-[#e6ce04]">
                              {formatDurationHours(
                                poolData.account.config.cycleDurationSeconds
                              )}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">
                              Total Rounds
                            </span>
                            <span className="text-[#e6ce04]">
                              {poolData.account.totalCycles}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg md:text-xl font-medium text-[#e6ce04] mb-3">
                          Financial Details
                        </h3>
                        <div className="space-y-3 text-sm md:text-base">
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">
                              Entry Amount
                            </span>
                            <span className="text-[#e6ce04]">
                              {lamportsToSol(
                                poolData.account.config.contributionAmount
                              ).toString()}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">
                              Total Contributed
                            </span>
                            <span className="text-[#e6ce04]">
                              {lamportsToSol(
                                poolData.account.totalContributions
                              ).toString()}
                            </span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">
                              Yield Earned
                            </span>
                            <span className="text-[#e6ce04]">{"0 SOL"}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#f8e555]/70">
                              Early Withdraw Fee
                            </span>
                            <span className="text-[#e6ce04]">
                              {bpsToPercentage(
                                poolData.account.config.earlyWithdrawalFeeBps
                              )}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Your Position */}
                    {/* <div>
                      <h3 className="text-lg md:text-xl font-medium text-[#e6ce04] mb-3">
                        Your Position
                      </h3>
                      <div className="bg-[#010200] rounded-lg p-4 border border-[#e6ce04]/20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm md:text-base">
                          <div>
                            <p className="text-[#f8e555]/70 mb-1">Position</p>
                            <p className="text-md md:text-lg font-medium text-[#e6ce04]">
                              #{}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#f8e555]/70 mb-1">
                              Rounds to Wait
                            </p>
                            <p className="text-md md:text-lg font-medium text-[#e6ce04]">
                              {"data.user.roundsToWait"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#f8e555]/70 mb-1">
                              Contributed
                            </p>
                            <p className="text-md md:text-lg font-medium text-[#e6ce04]">
                              {"data.user.contributed"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#f8e555]/70 mb-1">Earned</p>
                            <p className="text-md md:text-lg font-medium text-[#e6ce04]">
                              {"data.user.earned"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                )}

                {activeTab === "members" && (
                  <div className="space-y-4">
                    {/* Replace with actual member data iteration if available */}
                    {Array.from({
                      length: poolData.account.memberAddresses.length,
                    }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center">
                            <Users className="w-4 h-4 text-[#e6ce04]" />
                          </div>
                          <div>
                            <p className="text-[#e6ce04]">
                              Member #{index + 1}
                            </p>
                            <p className="text-xs text-[#f8e555]/70">
                              {poolData.account.memberAddresses[
                                index
                              ].toString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#e6ce04]">
                            {"data.financials.contributionAmount"}
                          </p>
                          <p className="text-xs text-[#f8e555]/70">
                            Contributed
                          </p>
                        </div>
                      </div>
                    ))}
                    {poolData.account.memberAddresses.length === 0 && (
                      <p className="text-[#f8e555]/70 text-center py-4">
                        No members have joined yet.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === "history" && (
                  <div className="space-y-4">
                    {/* {data.history.map((event, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20 flex-wrap gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1a1a18] rounded-full flex items-center justify-center flex-shrink-0">
                            <History className="w-4 h-4 text-[#e6ce04]" />
                          </div>
                          <div>
                            <p className="text-[#e6ce04]">{event.type}</p>
                            <p className="text-xs text-[#f8e555]/70">
                              {event.date}
                            </p>
                          </div>
                        </div>
                        {(event.amount || event.recipient || event.creator) && (
                          <div className="text-right text-xs sm:text-sm">
                            {event.amount && (
                              <p className="text-[#e6ce04]">{event.amount}</p>
                            )}
                            {(event.recipient || event.creator) && (
                              <p className="text-[#f8e555]/70 break-all">
                                {event.recipient || event.creator}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    ))} */}
                    {/* {data.history.length === 0 && (
                      <p className="text-[#f8e555]/70 text-center py-4">
                        No pool history yet.
                      </p>
                    )} */}
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-6">
                    {/* Pool Statistics */}
                    <div>
                      <h3 className="text-lg md:text-xl font-medium text-[#e6ce04] mb-3">
                        Pool Statistics
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                        <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
                          <p className="text-[#f8e555]/70 mb-1">
                            Total Members
                          </p>
                          <p className="text-[#e6ce04] font-medium">
                            {poolData.account.memberAddresses.length}
                          </p>
                        </div>
                        <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
                          <p className="text-[#f8e555]/70 mb-1">
                            Total Payouts
                          </p>
                          <p className="text-[#e6ce04] font-medium">
                            {/* {poolData.account.totalPayouts} */}
                          </p>
                        </div>
                        <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
                          <p className="text-[#f8e555]/70 mb-1">
                            Average Yield
                          </p>
                          <p className="text-[#e6ce04] font-medium">{}</p>
                        </div>
                        <div className="bg-[#010200] p-3 rounded-lg border border-[#e6ce04]/20">
                          <p className="text-[#f8e555]/70 mb-1">
                            Completed Rounds
                          </p>
                          <p className="text-[#e6ce04] font-medium">
                            {poolData.account.currentCycle}/
                            {poolData.account.totalCycles}
                          </p>
                        </div>
                      </div>
                    </div>
                    {/* Security Info */}
                    <div>
                      <h3 className="text-lg md:text-xl font-medium text-[#e6ce04] mb-3">
                        Security Information
                      </h3>
                      <div className="bg-[#010200] p-4 rounded-lg border border-[#e6ce04]/20">
                        <div className="space-y-3 text-xs md:text-base break-all">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#f8e555]/70">
                              Pool Address
                            </span>
                            <span className="text-[#e6ce04]">
                              {poolData.publicKey.toString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#f8e555]/70">Creator</span>
                            <span className="text-[#e6ce04]">
                              {poolData.account.creator.toString()}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#f8e555]/70">Verified</span>
                            <span className="text-[#e6ce04]">{"Yes"}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#f8e555]/70">Audited</span>
                            <span className="text-[#e6ce04]">{"Yes"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Timer Card */}
            <div className="bg-[#1a1a18] rounded-xl p-6 border border-[#e6ce04]/20">
              <div className="text-center">
                <h3 className="text-lg md:text-xl font-bold text-[#e6ce04] mb-2">
                  Next Payout In
                </h3>
                <p className="text-3xl md:text-4xl font-mono font-bold text-[#e6ce04] mb-3">
                  {formatDurationHours(poolData.account.nextPayoutTimestamp)}
                </p>
              </div>
            </div>

            {/* Your Stats Card */}
            <div className="bg-[#1a1a18] rounded-xl p-6 border border-[#e6ce04]/20">
              <h3 className="text-lg md:text-xl font-bold text-[#e6ce04] mb-4">
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-[#f8e555]/70">Contributed</span>
                  <span className="text-[#e6ce04] font-bold text-base md:text-lg">
                    {lamportsToSol(memberDetails?.totalContributions || new BN(0))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-[#f8e555]/70">Collateral Staked</span>
                  <span className="text-[#e6ce04] font-bold text-base md:text-lg">
                    {(lamportsToSol(memberDetails?.collateralStaked || new BN(0)))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm md:text-base">
                  <span className="text-[#f8e555]/70">Status</span>
                  <span className="text-[#e6ce04] font-bold text-base md:text-lg">
                    {getStatusString(memberDetails?.status)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full-width Action Buttons */}
        {/* TODO: Conditionally render buttons based on pool status and user status */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveAction("bid")}
            className="w-full bg-[#e6ce04] text-[#010200] py-4 px-4 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-base md:text-xl"
          >
            <Zap className="w-6 h-6 mr-2" /> Place Bid
          </button>
          <button
            onClick={() => setActiveAction("contribute")}
            className="w-full bg-[#e6ce04] text-[#010200] py-4 px-4 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-base md:text-xl"
          >
            <Coins className="w-6 h-6 mr-2" /> Contribute
          </button>
          <button
            onClick={() => setActiveAction("withdraw")}
            className="w-full bg-[#e6ce04] text-[#010200] py-4 px-4 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-base md:text-xl"
          >
            <Wallet className="w-6 h-6 mr-2" /> Withdraw
          </button>
          <button
            onClick={() => setActiveAction("claim")}
            className="w-full bg-[#e6ce04] text-[#010200] py-4 px-4 rounded-lg hover:bg-[#f8e555] flex items-center justify-center font-bold text-base md:text-xl"
          >
            <Trophy className="w-6 h-6 mr-2" /> Claim Payout
          </button>
        </div>

        {/* Bottom section with the Progress Pool button */}
        {isPoolCreator && (
          <div className="mt-12 flex justify-center items-center w-full">
            <div className="text-center max-w-md mx-auto">
              <p className="text-base text-white mb-3 font-medium">
                Pool Creator Controls
              </p>
              <button
                onClick={() => setActiveAction("progress")}
                className="bg-red-600 hover:bg-red-700 text-white py-4 px-10 rounded-lg flex items-center justify-center font-bold text-base md:text-xl w-full"
              >
                Progress Pool
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
              <p className="text-sm text-gray-400 mt-3">
                Only the pool creator can progress the pool
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

// Note: Removed export default from here, it should be in page.tsx
