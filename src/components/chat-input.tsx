'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpIcon } from 'lucide-react';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    disabled: boolean;
}

export default function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`; // Max height 128px (8 lines)
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    const handleSendMessage = () => {
        if (!input.trim() || disabled) return;

        onSendMessage(input.trim());
        setInput('');

        // Reset textarea height after clearing input
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }, 0);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
    };

    return (
        <div className="bg-transparent pb-4 container">
            <div className="max-w-2xl mx-auto">
                <div className='flex items-end gap-x-3 bg-[#f0f8f0] px-2 rounded-xl'>
                    <div className="flex-1 rounded-xl">
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask FinAI about your finances..."
                            disabled={disabled}
                            className="w-full bg-transparent text-black placeholder-gray-700 p-3 rounded-xl resize-none focus:outline-none min-h-[44px] max-h-32 hide-scrollbar transition-all duration-200 outline-none border-none"
                            style={{ height: 'auto', overflowY: 'hidden' }}
                            autoFocus
                        />
                    </div>
                    <div className='pb-2'>
                        <button
                            onClick={handleSendMessage}
                            disabled={!input.trim() || disabled}
                            className="p-2 rounded-full bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200 shadow-sm"
                        >
                            <ArrowUpIcon className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}