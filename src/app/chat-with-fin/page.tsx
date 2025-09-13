'use client';
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Inter } from 'next/font/google';
import ChatInput from '@/components/chat-input';
import MessagesContainer from '@/components/message-container';

const inter = Inter({
    subsets: ["latin"],
    weight: ['100', '200', '300', '400', '500', '600', '700'],
})

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function ChatWithFinAI() {
    const router = useRouter();
    const { user, isLoaded } = useUser();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Redirect if user is not signed in
    useEffect(() => {
        if (isLoaded && !user) {
            router.push('/');
        }
    }, [isLoaded, user, router]);

    // Initial greeting with FinAI branding
    useEffect(() => {
        if (isLoaded && user) {
            const greeting: Message = {
                role: 'assistant',
                content: `Hi ${user.firstName || 'there'}! I'm FinAI, your personal financial assistant. How can I help you with your finances today?`,
                timestamp: new Date()
            };
            setMessages([greeting]);
        }
    }, [isLoaded, user]);

    // Dummy responses for testing
    const getDummyResponse = (userMessage: string): string => {
        const responses = [
            "Thank you for your question! As FinAI, I'm here to help you with financial planning and analysis.",
            "That's an interesting financial topic. Let me provide you with some insights based on current market trends.",
            "I understand your concern about financial matters. Here are some recommendations I can offer:",
            "Great question! Financial planning is crucial, and I'm here to guide you through it.",
            "Based on your inquiry, here's what I suggest for your financial situation:"
        ];
        
        // Simple logic to vary responses
        const responseIndex = userMessage.length % responses.length;
        return responses[responseIndex];
    };

    const handleSendMessage = async (messageContent: string) => {
        const userMessage: Message = {
            role: 'user',
            content: messageContent,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
            
            // Get dummy response
            const dummyResponse = getDummyResponse(messageContent);
            
            const assistantMessage: Message = {
                role: 'assistant',
                content: dummyResponse,
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
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
        router.push('/');
    };

    // Show loading while auth state is being determined
    if (!isLoaded) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-green-300 border-t-green-500 rounded-full animate-spin" />
            </div>
        );
    }

    // Don't render anything if user is not signed in (will redirect)
    if (!user) {
        return null;
    }

    return (
        <div className={`h-screen flex flex-col ${inter.className}`}>
            {/* Custom scrollbar styles */}
            <style jsx global>{`
                .hide-scrollbar {
                    -ms-overflow-style: none;  /* Internet Explorer 10+ */
                    scrollbar-width: none;  /* Firefox */
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;  /* Safari and Chrome */
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