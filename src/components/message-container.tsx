'use client';
import { useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import MessageBubble from './message-bubble';
import TypingIndicator from './typing-indicator';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface MessagesContainerProps {
    messages: Message[];
    isLoading: boolean;
}

export default function MessagesContainer({ messages, isLoading }: MessagesContainerProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const shouldAutoScrollRef = useRef(true);
    const lastMessageContentRef = useRef<string>('');
    const isUserInteractingRef = useRef(false);
    const userInteractionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Simple and reliable scroll to bottom
    const scrollToBottom = useCallback((smooth = false) => {
        const container = containerRef.current;
        if (!container) return;

        if (smooth) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        } else {
            container.scrollTop = container.scrollHeight;
        }
    }, []);

    // Check if user is at the bottom
    const isAtBottom = useCallback(() => {
        const container = containerRef.current;
        if (!container) return false;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const threshold = 50; // 50px threshold
        return scrollHeight - scrollTop - clientHeight < threshold;
    }, []);

    // Handle user scroll with debouncing
    const handleScroll = useCallback(() => {
        // Mark user as interacting
        isUserInteractingRef.current = true;
        
        // Update auto-scroll preference based on position
        shouldAutoScrollRef.current = isAtBottom();

        // Clear existing timeout
        if (userInteractionTimeoutRef.current) {
            clearTimeout(userInteractionTimeoutRef.current);
        }

        // Reset user interaction flag after delay
        userInteractionTimeoutRef.current = setTimeout(() => {
            isUserInteractingRef.current = false;
        }, 1000); // 1 second delay
    }, [isAtBottom]);

    // Setup scroll listener with proper cleanup
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        container.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (userInteractionTimeoutRef.current) {
                clearTimeout(userInteractionTimeoutRef.current);
            }
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // Auto-scroll for new messages
    useEffect(() => {
        if (shouldAutoScrollRef.current && !isUserInteractingRef.current) {
            // Clear any existing timeout
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
            }

            // Delay to ensure DOM has updated
            autoScrollTimeoutRef.current = setTimeout(() => {
                scrollToBottom(true);
            }, 100);
        }
    }, [messages.length, scrollToBottom]);

    // Handle streaming content updates
    useEffect(() => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) return;

        const currentContent = lastMessage.content;
        const hasContentChanged = currentContent !== lastMessageContentRef.current;
        lastMessageContentRef.current = currentContent;

        // Auto-scroll during streaming if conditions are met
        if (hasContentChanged && 
            lastMessage.role === 'assistant' && 
            shouldAutoScrollRef.current && 
            !isUserInteractingRef.current) {
            
            // Clear any existing timeout
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
            }

            // Smooth scroll with short delay
            autoScrollTimeoutRef.current = setTimeout(() => {
                scrollToBottom(true);
            }, 50);
        }
    }, [messages, scrollToBottom]);

    // Handle loading state changes
    useEffect(() => {
        if (!isLoading && shouldAutoScrollRef.current && !isUserInteractingRef.current) {
            // Final scroll when AI finishes responding
            setTimeout(() => {
                scrollToBottom(true);
            }, 200);
        }
    }, [isLoading, scrollToBottom]);

    // Initial scroll to bottom
    useLayoutEffect(() => {
        scrollToBottom(false); // Instant scroll on mount
    }, [scrollToBottom]);

    // Cleanup timeouts on unmount
    useEffect(() => {
        return () => {
            if (userInteractionTimeoutRef.current) {
                clearTimeout(userInteractionTimeoutRef.current);
            }
            if (autoScrollTimeoutRef.current) {
                clearTimeout(autoScrollTimeoutRef.current);
            }
        };
    }, []);

    return (
        <>
            <div 
                ref={containerRef}
                className="flex-1 pt-24 lg:pt-6 py-6 scrollbar-hide"
                style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    WebkitOverflowScrolling: 'touch',
                    scrollBehavior: 'smooth'
                }}
            >
                <div className="lg:max-w-2xl mx-auto py-2 px-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {messages.map((message, index) => (
                            <div key={`${message.timestamp.getTime()}-${index}`} className="mb-4 last:mb-2">
                                <MessageBubble 
                                    message={message} 
                                    index={index} 
                                />
                            </div>
                        ))}
                    </AnimatePresence>

                    {/* Scroll anchor with proper spacing */}
                    <div 
                        ref={messagesEndRef} 
                        className="h-16" 
                        aria-hidden="true"
                    />
                </div>
            </div>

            {/* Clean CSS for scrollbar hiding */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar { 
                    display: none;
                }
            `}</style>
        </>
    );
}