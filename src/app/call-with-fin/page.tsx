"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import Vapi from "@vapi-ai/web";
import type {
    FinancialData,
    AssetRecord,
    LiabilityRecord,
    InvestmentRecord,
    PpfRecord,
} from "@/lib/types";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const VAPI_API_KEY = process.env.NEXT_PUBLIC_VAPI_API_KEY!;
const ASSISTANT_ID = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID!;

type CallState = "idle" | "connecting" | "active" | "ended";
type Mode = "speaking" | "listening";

// FinancialData is imported from shared types

export default function ChatWithFinAI() {
    const router = useRouter();
    const { isSignedIn, isLoaded, user } = useUser();

    // ALL STATE AND REFS - MUST BE BEFORE CONDITIONAL RETURNS
    const [isClient, setIsClient] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);
    const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [callState, setCallState] = useState<CallState>("idle");
    const [mode, setMode] = useState<Mode>("listening");
    const [error, setError] = useState<string | null>(null);
    const audioVisualizerRef = useRef<HTMLDivElement | null>(null);
    const initializedRef = useRef(false);
    const speechEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ALL DERIVED STATE - MUST BE BEFORE CONDITIONAL RETURNS
    const isInCall = useMemo(
        () => callState === "connecting" || callState === "active",
        [callState]
    );

    const canStart = useMemo(
        () => (callState === "idle" || callState === "ended") && isReady && financialData,
        [callState, isReady, financialData]
    );

    const canEnd = useMemo(
        () => callState === "connecting" || callState === "active",
        [callState]
    );

    // Function to get user's financial data
    const getUserFinancialData = async (userEmail: string) => {
        try {
            console.log("📊 Fetching financial data for:", userEmail);
            
            // Get user basic info
            const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', userEmail)
                .single();

            // Get assets
            const { data: assetsData } = await supabase
                .from('assets')
                .select('*')
                .eq('user_email', userEmail);

            // Get liabilities
            const { data: liabilitiesData } = await supabase
                .from('liabilities')
                .select('*')
                .eq('user_email', userEmail);

            // Get investments
            const { data: investmentsData } = await supabase
                .from('investments')
                .select('*')
                .eq('user_email', userEmail);

            // Get PPF balance
            const { data: ppfData } = await supabase
                .from('ppf_balance')
                .select('*')
                .eq('user_email', userEmail)
                .single();

            return {
                user: userData,
                assets: assetsData || [],
                liabilities: liabilitiesData || [],
                investments: investmentsData || [],
                ppf: ppfData
            };
        } catch (error) {
            console.error('Error fetching financial data:', error);
            return null;
        }
    };

    // Format financial data for VAPI variables
    const formatFinancialDataForVapi = (data: FinancialData) => {
        const { user, assets, liabilities, investments, ppf } = data;
        
        // Calculate totals
        const totalAssets = assets.reduce((sum: number, asset: AssetRecord) => sum + (asset.value ?? 0), 0);
        const totalLiabilities = liabilities.reduce((sum: number, liability: LiabilityRecord) => sum + (liability.amount ?? 0), 0);
        const totalInvestments = investments.reduce((sum: number, investment: InvestmentRecord) => sum + (investment.total_value ?? 0), 0);
        const netWorth = user?.net_worth || (totalAssets - totalLiabilities);

        return {
            // Basic info
            firstName: user?.firstName || "there",
            netWorth: netWorth?.toLocaleString() || "0",
            monthlyIncome: user?.monthly_income?.toLocaleString() || "Not set",
            creditScore: user?.credit_score?.toString() || "Not set",
            
            // Totals
            totalAssets: totalAssets.toLocaleString(),
            totalLiabilities: totalLiabilities.toLocaleString(),
            totalInvestments: totalInvestments.toLocaleString(),
            ppfBalance: ppf?.total_balance?.toLocaleString() || "0",
            
            // Asset details
            assetsCount: assets.length.toString(),
            topAsset: assets.length > 0 ? assets.reduce((max, asset) => (asset.value ?? 0) > (max.value ?? 0) ? asset : max).name : "None",
            
            // Liability details
            liabilitiesCount: liabilities.length.toString(),
            highestDebt: liabilities.length > 0 ? liabilities.reduce((max, liability) => (liability.amount ?? 0) > (max.amount ?? 0) ? liability : max).name : "None",
            
            // Investment details
            investmentsCount: investments.length.toString(),
            bestPerformer: investments.length > 0 ? investments.reduce((max, inv) => (inv.gain_loss_percentage ?? 0) > (max.gain_loss_percentage ?? 0) ? inv : max).name : "None",
            portfolioGain: investments.length > 0 ? investments.reduce((sum, inv) => sum + (inv.gain_loss ?? 0), 0).toFixed(0) : "0",
            
            // PPF details
            ppfContribution: ppf?.annual_contribution?.toLocaleString() || "0",
            ppfInterestRate: ppf?.interest_rate?.toString() || "7.1",
            
            // Financial health indicators
            debtToIncomeRatio: user?.monthly_income ? ((totalLiabilities / 12) / user.monthly_income * 100).toFixed(1) : "0",
            investmentToIncomeRatio: user?.monthly_income ? ((totalInvestments / 12) / user.monthly_income * 100).toFixed(1) : "0"
        };
    };

    // ALL EFFECTS - MUST BE BEFORE CONDITIONAL RETURNS
    useEffect(() => setIsClient(true), []);

    // Check authentication and redirect if not signed in
    useEffect(() => {
        if (isLoaded && !isSignedIn) {
            router.push("/");
        }
    }, [isLoaded, isSignedIn, router]);

    // Load financial data when component mounts
    useEffect(() => {
        const loadFinancialData = async () => {
            if (isLoaded && user?.emailAddresses?.[0]?.emailAddress) {
                setIsLoadingData(true);
                const userEmail = user.emailAddresses[0].emailAddress;
                const data = await getUserFinancialData(userEmail);
                setFinancialData(data);
                setIsLoadingData(false);
            }
        };

        loadFinancialData();
    }, [isLoaded, user]);

    // Initialize Vapi once on client
    useEffect(() => {
        if (!isClient) return;
        if (initializedRef.current) return;

        if (!VAPI_API_KEY) {
            setError("Missing Vapi public API key (NEXT_PUBLIC_VAPI_API_KEY).");
            return;
        }

        try {
            const v = new Vapi(VAPI_API_KEY);
            vapiRef.current = v;

            // Core lifecycle
            v.on("call-start", () => {
                console.log("📞 Call started");
                setCallState("active");
            });

            v.on("call-end", () => {
                console.log("📞 Call ended");
                setCallState("ended");
                setMode("listening");
                if (speechEndTimeoutRef.current) {
                    clearTimeout(speechEndTimeoutRef.current);
                    speechEndTimeoutRef.current = null;
                }
            });

            v.on("error", (e// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
                console.error("❌ Vapi error:", e);
                setError(typeof e === "string" ? e : e?.message ?? "Unknown error");
                setCallState("ended");
                setMode("listening");
            });

            v.on("speech-start", () => {
                console.log("🗣️ AI started speaking");
                if (speechEndTimeoutRef.current) {
                    clearTimeout(speechEndTimeoutRef.current);
                    speechEndTimeoutRef.current = null;
                }
                setMode("speaking");
            });

            v.on("speech-end", () => {
                console.log("🤐 AI stopped speaking");
                setMode("listening");
                speechEndTimeoutRef.current = null;
            });

            v.on("message", (message// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) => {
                console.log("💬 Message:", message);
            });

            initializedRef.current = true;
            setIsReady(true);
        } catch (e// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
            setError(e?.message ?? "Failed to initialize Vapi");
            setIsReady(false);
        }

        // Cleanup
        return () => {
            const v = vapiRef.current;
            if (v) {
                try {
                    v.removeAllListeners();
                    v.stop();
                } catch {
                    // ignore
                }
            }
            if (speechEndTimeoutRef.current) {
                clearTimeout(speechEndTimeoutRef.current);
            }
            vapiRef.current = null;
            initializedRef.current = false;
            setIsReady(false);
        };
    }, [isClient]);

    // Fallback alternation during active calls when no speech events occur
    useEffect(() => {
        if (callState !== "active") return;
        const id = setInterval(() => {
            console.log("🔄 Fallback mode switch");
            setMode((prev) => (prev === "speaking" ? "listening" : "speaking"));
        }, 15000);
        return () => clearInterval(id);
    }, [callState]);

    // ALL CALLBACKS - MUST BE BEFORE CONDITIONAL RETURNS
    const startCall = useCallback(async () => {
        setError(null);

        if (!isClient) {
            setError("Not on client; cannot start call.");
            return;
        }

        if (!vapiRef.current) {
            setError("Vapi not initialized yet. Please wait a moment.");
            return;
        }

        if (!ASSISTANT_ID) {
            setError("Assistant ID is not configured (NEXT_PUBLIC_VAPI_ASSISTANT_ID).");
            return;
        }

        if (!financialData) {
            setError("Financial data not loaded yet. Please wait.");
            return;
        }

        if (isInCall) return;

        try {
            setCallState("connecting");
            
            // Format financial data for VAPI
            const vapiVariables = formatFinancialDataForVapi(financialData)

            await vapiRef.current.start(ASSISTANT_ID, {
                variableValues: {
                    firstName: user?.firstName || "there",
                    financeData: vapiVariables
                }
            });
        } catch (e// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
            console.error("❌ Failed to start call:", e);
            setError(e?.message ?? "Failed to start call");
            setCallState("ended");
        }
    }, [isClient, isInCall, financialData]);

    const endCall = useCallback(async () => {
        setError(null);
        const v = vapiRef.current;
        if (!v) return;
        try {
            console.log("⏹️ Ending call");
            await v.stop();
        } catch (e// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) {
            setError(e?.message ?? "Failed to end call");
        }
    }, []);

    const handleBack = useCallback(async () => {
        if (isInCall) {
            try {
                await endCall();
            } catch {
                // ignore
            }
        }
        router.push("/dashboard");
    }, [endCall, isInCall, router]);

    // NOW SAFE TO HAVE CONDITIONAL RETURNS AFTER ALL HOOKS

    // Show loading spinner while checking auth or loading data
    if (!isLoaded || isLoadingData) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-green-50/80">
                <Spinner />
                <p className="mt-4 text-sm text-muted-foreground">
                    {!isLoaded ? 'Loading...' : 'Loading your financial data...'}
                </p>
            </main>
        );
    }

    // Don't render anything if user is not signed in (will redirect)
    if (!isSignedIn) {
        return null;
    }

    // Show error if financial data couldn't be loaded
    if (!financialData) {
        return (
            <main className="min-h-screen flex flex-col items-center justify-center bg-green-50/80">
                <div className="text-red-500 text-center space-y-4">
                    <p className="text-lg font-semibold">Unable to load financial data</p>
                    <p className="text-sm">Please try refreshing the page or go back to dashboard.</p>
                    <Button onClick={handleBack} variant="outline">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen flex flex-col bg-green-50/80">
            {/* Header with Back button */}
            <div className="flex items-center justify-center p-6 w-full max-w-3xl mx-auto">
                <Button
                    onClick={handleBack}
                    aria-label="Back to home"
                    className="rounded-full"
                >
                    <ChevronLeft /> Back
                </Button>
            </div>

            {/* Main content area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6">
                {/* Voice orb container */}
                <div className="w-full max-w-lg mx-auto flex flex-col items-center">

                    {/* Voice orb and visualizer */}
                    <div className="w-full flex flex-col items-center justify-center px-6 relative">
                        <div className="relative flex items-center justify-center h-40 w-40">
                            {/* Subtle outer glow */}
                            <motion.div
                                className="absolute h-40 w-40 rounded-full bg-green-500/20 blur-md"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.3, 0.5, 0.3]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 4,
                                    ease: "easeInOut"
                                }}
                            />

                            {/* Main orb container */}
                            <motion.div
                                className="absolute h-32 w-32 rounded-full overflow-hidden"
                                animate={{
                                    scale: mode === 'speaking'
                                        ? [1, 1.05, 1, 1.1, 1, 1, 1.05, 1, 1.1, 1]
                                        : [1, 0.97, 1]
                                }}
                                transition={{
                                    repeat: Infinity,
                                    duration: mode === 'speaking' ? 3 : 2,
                                    ease: "easeInOut"
                                }}
                            >
                                {/* Gradient background */}
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-b from-green-300 via-green-400 to-green-600"
                                />

                                {/* White cloud formations */}
                                <motion.div
                                    className="absolute inset-0 opacity-80"
                                    style={{
                                        background: `
                                            radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9) 0%, transparent 28%),
                                            radial-gradient(circle at 70% 25%, rgba(255,255,255,0.9) 0%, transparent 30%),
                                            radial-gradient(circle at 45% 52%, rgba(255,255,255,0.9) 0%, transparent 38%)
                                        `
                                    }}
                                    animate={{
                                        rotate: 360
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 25,
                                        ease: "linear"
                                    }}
                                />

                                {/* Additional white cloud formations */}
                                <motion.div
                                    className="absolute inset-0"
                                    style={{
                                        background: `
                                            radial-gradient(ellipse at 65% 65%, rgba(255,255,255,0.75) 0%, transparent 30%),
                                            radial-gradient(circle at 25% 70%, rgba(255,255,255,0.7) 0%, transparent 25%)
                                        `
                                    }}
                                    animate={{
                                        rotate: -360
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 30,
                                        ease: "linear"
                                    }}
                                />

                                {/* More dynamic swirling effect */}
                                <motion.div
                                    className="absolute inset-0 opacity-70"
                                    style={{
                                        background: `
                                            radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.8) 0%, transparent 45%),
                                            radial-gradient(circle at 60% 60%, rgba(255,255,255,0.7) 0%, transparent 30%)
                                        `
                                    }}
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        x: [0, 5, 0, -5, 0],
                                        y: [0, -5, 0, 5, 0],
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        duration: 20,
                                        ease: "easeInOut"
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Audio visualizer */}
                        <div className="flex items-center justify-center gap-1 h-12 mt-2" ref={audioVisualizerRef}>
                            {Array.from({ length: 9 }).map((_, index) => (
                                <motion.div
                                    key={index}
                                    className="w-1 rounded-full bg-green-500"
                                    initial={{ height: 4 }}
                                    animate={{
                                        height: mode === 'speaking'
                                            ? [4, 12 + Math.random() * 20, 4]
                                            : [4, 8 + Math.sin(index * 0.8) * 12, 4],
                                        opacity: [0.6, 1, 0.6]
                                    }}
                                    transition={{
                                        repeat: Infinity,
                                        repeatType: "reverse",
                                        duration: mode === 'speaking'
                                            ? 0.4 + Math.random() * 0.3
                                            : 0.7 + Math.sin(index * 0.5) * 0.3,
                                        ease: "easeInOut",
                                        delay: index * 0.05
                                    }}
                                />
                            ))}
                        </div>

                        {/* Status text */}
                        <div className="mt-4 text-center font-medium">
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className="text-sm text-green-950"
                                aria-live="polite"
                            >
                                {callState === "connecting"
                                    ? "Connecting..."
                                    : callState === "active"
                                        ? mode === 'speaking'
                                            ? 'FinAI is speaking...'
                                            : 'Listening...'
                                        : callState === "ended"
                                            ? "Call ended"
                                            : isReady && financialData
                                                ? "Ready to chat with FinAI"
                                                : "Initializing..."}
                            </motion.span>
                        </div>
                    </div>

                    {/* Single dynamic button with loading states */}
                    <div className="flex flex-col items-center mt-6">
                        {callState === "idle" || callState === "ended" ? (
                            <Button
                                onClick={startCall}
                                disabled={!canStart}
                                className={`${!canStart ? "bg-gray-400 cursor-not-allowed" : ""}`}
                                aria-disabled={!canStart}
                                aria-label="Start chat with FinAI"
                                title={!isReady || !financialData ? "Loading financial data..." : undefined}
                            >
                                {isReady && financialData ? "Start call" : "Loading data..."}
                            </Button>
                        ) : callState === "connecting" ? (
                            <Button
                                disabled
                                aria-disabled={true}
                                aria-label="Connecting to FinAI"
                            >
                                <Spinner size="small" color="#fff" />
                            </Button>
                        ) : (
                            <Button
                                onClick={endCall}
                                disabled={!canEnd}
                                className={`${canEnd
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-red-300 cursor-not-allowed"
                                    }`}
                                aria-disabled={!canEnd}
                                aria-label="End chat"
                            >
                                End Chat
                            </Button>
                        )}

                        {error && (
                            <motion.p
                                className="mt-4 text-sm text-red-600 text-center max-w-xs"
                                role="alert"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                {error}
                            </motion.p>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer space */}
            <div className="h-16"></div>
        </main>
    );
}