'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Copy, Check } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import remarkGfm from 'remark-gfm';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

interface MessageBubbleProps {
    message: Message;
    index: number;
}

export default function MessageBubble({ message, index }: MessageBubbleProps) {
    const isAssistant = message.role === 'assistant';
    const [copied, setCopied] = useState(false);
    const [imageError, setImageError] = useState(false);
    const { user, isLoaded } = useUser();

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(message.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Optional: Handle error
        }
    };

    const handleImageError = () => setImageError(true);

    const getUserInitial = () => {
        if (user?.firstName) return user.firstName.charAt(0).toUpperCase();
        if (user?.lastName) return user.lastName.charAt(0).toUpperCase();
        if (user?.emailAddresses?.[0]?.emailAddress)
            return user.emailAddresses[0].emailAddress.charAt(0).toUpperCase();
        return 'U';
    };

    // Simplified and improved markdown cleaning
    const cleanMarkdown = (content: string) => {
        return content
            // Normalize line breaks
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')

            // Fix the specific pattern where numbered lists are broken
            // Convert "1. *What's the main goal..." to "1. What's the main goal..."
            .replace(/(\d+\.\s*)\*([^*]+)\*/g, '$1**$2**')

            // Ensure numbered lists are properly formatted
            .replace(/(\d+\.\s*)\n+/g, '$1 ')

            // Remove standalone asterisks and bullet points that don't belong
            .replace(/^\s*\*\s*\*?\s*$/gm, '')
            .replace(/^\s*\*\s*$/gm, '')
            .replace(/^\s*•\s*•?\s*$/gm, '')

            // Clean up multiple consecutive newlines but preserve paragraph breaks
            .replace(/\n{3,}/g, '\n\n')

            // Remove extra spaces
            .replace(/[ \t]+/g, ' ')

            // Trim whitespace
            .trim();
    };

    return (
        <motion.div
            key={`message-${index}-${message.timestamp.getTime()}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex mb-4 ${isAssistant
                ? 'flex-row items-start'
                : 'flex-row-reverse items-start'
                }`}
        >
            {/* Avatar */}
            <div className={isAssistant ? 'flex-shrink-0 mr-3' : 'flex-shrink-0 ml-3'}>
                {isAssistant ? (
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full hidden lg:flex items-center justify-center">
                        <span className="text-white text-sm font-instrument">F</span>
                    </div>
                ) : (
                    isLoaded &&
                        user?.hasImage &&
                        user?.imageUrl &&
                        !imageError ? (
                        <img
                            src={user.imageUrl}
                            alt={user.firstName || 'User'}
                            className="hidden lg:flex w-8 h-8 rounded-full object-cover"
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">
                                {getUserInitial()}
                            </span>
                        </div>
                    )
                )}
            </div>

            {/* Message content + timestamp */}
            <div className="flex flex-col items-start">
                <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-t-xl ${message.role === 'user' ? 'rounded-bl-xl' : 'rounded-br-xl'
                        } ${message.role === 'user'
                            ? 'bg-green-500 text-white'
                            : 'bg-[#f0f8f0] text-gray-800'
                        } transform transition-all duration-200 relative group`}
                >
                    {/* Copy button for assistant */}
                    {isAssistant && (
                        <button
                            onClick={copyToClipboard}
                            className="absolute bottom-0 -right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded bg-white bg-opacity-20 hover:bg-opacity-30"
                            title="Copy message"
                        >
                            {copied ? (
                                <Check size={12} className="text-green-600" />
                            ) : (
                                <Copy size={12} className="text-gray-600" />
                            )}
                        </button>
                    )}

                    {isAssistant ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-li:leading-relaxed">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                    h1: ({ node, ...props }) => (
                                        <h1 className="text-lg font-bold mb-2 mt-0" {...props} />
                                    ),
                                    h2: ({ node, ...props }) => (
                                        <h2 className="text-base font-semibold mb-2 mt-2" {...props} />
                                    ),
                                    h3: ({ node, ...props }) => (
                                        <h3 className="text-sm font-medium mb-1 mt-2" {...props} />
                                    ),
                                    p: ({ node, ...props }) => (
                                        <p className="text-sm leading-relaxed mb-2 mt-0 last:mb-1" {...props} />
                                    ),
                                    strong: ({ node, ...props }) => (
                                        <strong className="font-semibold" {...props} />
                                    ),
                                    em: ({ node, ...props }) => (
                                        <em className="italic" {...props} />
                                    ),
                                    ul: ({ node, ...props }) => (
                                        <ul className="text-sm leading-relaxed mb-2 mt-1 ml-4" style={{ listStyleType: 'disc' }} {...props} />
                                    ),
                                    ol: ({ node, ...props }) => (
                                        <ol className="text-sm leading-relaxed mb-2 mt-1 ml-4" style={{ listStyleType: 'decimal' }} {...props} />
                                    ),
                                    li: ({ node, ...props }) => (
                                        <li className="text-sm leading-relaxed mb-0" style={{ display: 'list-item' }} {...props} />
                                    ),
                                    blockquote: ({ node, ...props }) => (
                                        <blockquote className="border-l-4 border-gray-300 pl-3 italic mb-2 mt-1" {...props} />
                                    ),
                                    table: ({ node, ...props }) => (
                                        <div className="overflow-x-auto mb-4">
                                            <table className="min-w-full border-collapse border border-gray-800 text-sm rounded-xl overflow-hidden bg-green-50" {...props} />
                                        </div>
                                    ),
                                    thead: ({ node, ...props }) => (
                                        <thead className="bg-green-100" {...props} />
                                    ),
                                    tbody: ({ node, ...props }) => (
                                        <tbody {...props} />
                                    ),
                                    tr: ({ node, ...props }) => (
                                        <tr className="border-b border-gray-400" {...props} />
                                    ),
                                    th: ({ node, ...props }) => (
                                        <th className="border border-gray-400 px-3 py-2 text-left font-semibold bg-green-50" {...props} />
                                    ),
                                    td: ({ node, ...props }) => (
                                        <td className="border border-gray-400 px-3 py-2" {...props} />
                                    ),
                                    code: ({ node, inline, ...props }// eslint-disable-next-line @typescript-eslint/no-explicit-any
any) =>
                                        inline ? (
                                            <code className="bg-gray-200 px-1 py-0.5 rounded text-xs font-mono" {...props} />
                                        ) : (
                                            <pre className="bg-gray-200 p-2 rounded text-xs font-mono mb-2 mt-1 overflow-x-auto">
                                                <code {...props} />
                                            </pre>
                                        )
                                }}
                            >
                                {cleanMarkdown(message.content)}
                            </ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                </div>

                <div
                    className={`text-xs text-gray-500 mt-1 px-1 ${isAssistant ? 'text-left' : 'text-right w-full'
                        }`}
                >
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </motion.div>
    );
}