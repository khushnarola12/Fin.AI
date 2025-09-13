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
    const prevMessagesLengthRef = useRef(messages.length);
    const scrollAnimationRef = useRef<number | null>(null);
    const isScrollingRef = useRef(false);
    const autoScrollAnimationRef = useRef<number | null>(null);

    // Smooth scroll to bottom function for auto-scrolling
    const smoothScrollToBottom = useCallback((duration = 300) => {
        const container = containerRef.current;
        if (!container) return;

        const start = container.scrollTop;
        const target = container.scrollHeight - container.clientHeight;
        const distance = target - start;

        if (Math.abs(distance) < 10) {
            container.scrollTop = target;
            return;
        }

        let startTime = 0;

        // Cancel any existing auto-scroll animation
        if (autoScrollAnimationRef.current) {
            cancelAnimationFrame(autoScrollAnimationRef.current);
        }

        const animateScroll = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function for smooth animation
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            container.scrollTop = start + (distance * easeOutQuart);

            if (progress < 1) {
                autoScrollAnimationRef.current = requestAnimationFrame(animateScroll);
            } else {
                autoScrollAnimationRef.current = null;
            }
        };

        autoScrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }, []);

    // Instant scroll to bottom (fallback)
    const instantScrollToBottom = useCallback(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, []);

    // Handle scroll events to determine if user is at bottom
    const handleScroll = useCallback(() => {
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
        }

        const container = containerRef.current;
        if (container && !autoScrollAnimationRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
            const isNearBottom = distanceFromBottom < 100;

            shouldAutoScrollRef.current = isNearBottom;
        }
    }, []);

    // Custom smooth wheel scroll handler
    const handleWheel = useCallback((e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const container = containerRef.current;
        if (!container) return;

        // Cancel auto-scroll animation if user scrolls manually
        if (autoScrollAnimationRef.current) {
            cancelAnimationFrame(autoScrollAnimationRef.current);
            autoScrollAnimationRef.current = null;
        }

        const delta = e.deltaY;
        const scrollSpeed = 10;
        
        isScrollingRef.current = true;
        
        // Clear any existing animation
        if (scrollAnimationRef.current) {
            cancelAnimationFrame(scrollAnimationRef.current);
        }

        let start = container.scrollTop;
        let target = start + (delta * scrollSpeed);
        
        // Clamp target to valid scroll range
        target = Math.max(0, Math.min(target, container.scrollHeight - container.clientHeight));
        
        const distance = target - start;
        const duration = 16;
        let progress = 0;

        const animateScroll = () => {
            progress += 1 / duration;
            
            if (progress >= 1) {
                container.scrollTop = target;
                isScrollingRef.current = false;
                handleScroll();
                return;
            }
            
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            container.scrollTop = start + (distance * easeOutCubic);
            
            scrollAnimationRef.current = requestAnimationFrame(animateScroll);
        };

        scrollAnimationRef.current = requestAnimationFrame(animateScroll);
    }, [handleScroll]);

    // Setup event listeners
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll, { passive: true });
            container.addEventListener('wheel', handleWheel, { passive: false });
            
            return () => {
                container.removeEventListener('scroll', handleScroll);
                container.removeEventListener('wheel', handleWheel);
                if (scrollAnimationRef.current) {
                    cancelAnimationFrame(scrollAnimationRef.current);
                }
                if (autoScrollAnimationRef.current) {
                    cancelAnimationFrame(autoScrollAnimationRef.current);
                }
            };
        }
    }, [handleScroll, handleWheel]);

    // Handle new messages with smooth scroll
    useEffect(() => {
        const hasNewMessage = messages.length > prevMessagesLengthRef.current;
        prevMessagesLengthRef.current = messages.length;

        if (hasNewMessage && shouldAutoScrollRef.current) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => {
                smoothScrollToBottom(400); // 400ms smooth scroll
            }, 50);
        }
    }, [messages.length, smoothScrollToBottom]);

    // Handle AI response completion with smooth scroll
    useEffect(() => {
        if (!isLoading && shouldAutoScrollRef.current) {
            setTimeout(() => {
                smoothScrollToBottom(300); // 300ms smooth scroll
            }, 100);
        }
    }, [isLoading, smoothScrollToBottom]);

    // Initial scroll to bottom (instant)
    useEffect(() => {
        instantScrollToBottom();
    }, [instantScrollToBottom]);

    return (
        <>
            <div 
                ref={containerRef}
                className="flex-1 pt-24 lg:pt-6 py-6 scrollbar-hide"
                style={{
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    overflowAnchor: 'none',
                    scrollBehavior: 'auto',
                    transform: 'translateZ(0)',
                    WebkitOverflowScrolling: 'touch'
                }}
            >
                <div className="lg:max-w-2xl mx-auto py-2">
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

                    {/* Typing indicator */}
                    <AnimatePresence mode="wait">
                        {isLoading && (
                            <div key="typing-indicator" className="mb-4">
                                <TypingIndicator />
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Scroll anchor */}
                    <div 
                        ref={messagesEndRef} 
                        className="h-1" 
                        aria-hidden="true"
                    />
                </div>
            </div>

            {/* Enhanced CSS for smooth scrolling */}
            <style jsx>{`
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar { 
                    display: none;
                }
                
                /* Smooth scrolling optimizations for chat container only */
                .scrollbar-hide {
                    transform: translateZ(0);
                    -webkit-overflow-scrolling: touch;
                }
            `}</style>
        </>
    );
}