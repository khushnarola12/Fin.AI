'use client';
import { motion } from 'framer-motion';

export default function TypingIndicator() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{
                duration: 0,
                ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className="flex justify-start"
        >
            <div className="w-8 h-8 bg-gradient-to-br mr-3 from-green-400 to-green-600 rounded-full hidden lg:flex items-center justify-center shadow-sm">
                <span className="text-white text-lg font-instrument">Fin</span>
            </div>
            <div className="bg-[#f0f8f0] rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-500 font-light">FinAI is thinking...</span>
                </div>
            </div>
        </motion.div>
    );
}