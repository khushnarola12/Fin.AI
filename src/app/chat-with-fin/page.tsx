'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Inter } from 'next/font/google';
import ChatInput from '@/components/chat-input';
import MessagesContainer from '@/components/message-container';
import { supabase } from '@/lib/supabase';
import type { FinancialData } from "@/lib/types";

const inter = Inter({
    subsets: ["latin"],
    weight: ['100', '200', '300', '400', '500', '600', '700'],
});

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

// FinancialData is imported from shared types

export default function ChatWithFinAI() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [financialData, setFinancialData] = useState<FinancialData | null>(null);

    // Function to get user's financial data
    const getUserFinancialData = async (userEmail: string) => {
        try {
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

    // Redirect if user is not signed in
    useEffect(() => {
        if (isLoaded && !user) {
            router.push('/');
        }
    }, [isLoaded, user, router]);

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

    // Initial greeting with FinAI branding
    useEffect(() => {
        if (isLoaded && user && !isLoadingData) {
            const greeting: Message = {
                role: 'assistant',
                content: `Hi ${user.firstName || 'there'}! I'm FinAI, your personal financial assistant. I have access to your financial data and can help you with budgeting, investment advice, expense analysis, and financial planning. What would you like to know about your finances?`,
                timestamp: new Date()
            };
            setMessages([greeting]);
        }
    }, [isLoaded, user, isLoadingData]);

    const handleSendMessage = async (messageContent: string) => {
        if (!financialData) {
            console.error('Financial data not available');
            return;
        }

        const userMessage: Message = {
            role: 'user',
            content: messageContent,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageContent,
                    financialData: financialData, // Pass the financial data
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            // Handle streaming response
            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = '';

            // Add initial assistant message
            const assistantMessage: Message = {
                role: 'assistant',
                content: '',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n');

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                break;
                            }
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.content) {
                                    assistantContent += parsed.content;
                                    // Update the last message (assistant message)
                                    setMessages(prev => {
                                        const updated = [...prev];
                                        updated[updated.length - 1] = {
                                            ...updated[updated.length - 1],
                                            content: assistantContent
                                        };
                                        return updated;
                                    });
                                }
                            } catch (e) {
                                // Ignore parsing errors for malformed chunks
                            }
                        }
                    }
                }
            }

        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        router.push('/dashboard');
    };

    // Show loading while auth state is being determined or financial data is loading
    if (!isLoaded || isLoadingData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4">
                <div className="w-8 h-8 border-2 border-green-300 border-t-green-500 rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                    {!isLoaded ? 'Loading...' : 'Loading your financial data...'}
                </p>
            </div>
        );
    }

    // Don't render anything if user is not signed in (will redirect)
    if (!user) {
        return null;
    }

    // Show error if financial data couldn't be loaded
    if (!financialData) {
        return (
            <div className="h-screen flex flex-col items-center justify-center space-y-4">
                <div className="text-red-500 text-center">
                    <p className="text-lg font-semibold">Unable to load financial data</p>
                    <p className="text-sm">Please try refreshing the page or go back to dashboard.</p>
                </div>
                <Button onClick={handleBack} variant="outline">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className={`h-screen flex flex-col ${inter.className}`}>
            {/* Custom scrollbar styles */}
            <style jsx global>{`
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                
                .smooth-scroll {
                    scroll-behavior: smooth;
                }
            `}</style>

            {/* Header */}
            <div className="fixed left-6 top-6 z-10">
                <Button
                    onClick={handleBack}
                    aria-label="Back to home"
                    className="rounded-full"
                >
                    <ChevronLeft /> Back
                </Button>
            </div>

            {/* Messages Container */}
            <MessagesContainer messages={messages} isLoading={isLoading} />

            {/* Input Area */}
            <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
    );
}