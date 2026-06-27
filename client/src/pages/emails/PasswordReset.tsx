import React from 'react';
import { motion } from 'framer-motion';
import { KeyRound, ArrowRight } from 'lucide-react';

export default function PasswordReset() {
  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-12 px-4 flex items-center justify-center font-sans">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-xl w-full bg-white dark:bg-black border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
           <img 
            src="/Comet Brew.svg" 
            alt="CometBrew Logo" 
            className="h-8 w-auto dark:invert" 
          />
          <span className="text-xs font-mono text-neutral-400">SECURITY</span>
        </div>

        <div className="p-8 md:p-12">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 text-red-600 dark:text-red-400">
            <KeyRound className="w-8 h-8" />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4">
            Reset your password
          </h1>
          
          <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8">
            We received a request to reset the password for your CometBrew account. If you didn't make this request, you can safely ignore this email.
          </p>

          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded border border-neutral-100 dark:border-neutral-800 mb-8 font-mono text-center text-xl tracking-widest select-all">
            8829-1029
          </div>

          <button className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 mb-6">
            Reset Password <ArrowRight className="w-4 h-4" />
          </button>
          
          <p className="text-sm text-neutral-500 dark:text-neutral-500">
            Or copy and paste this link into your browser:<br/>
            <span className="text-blue-500 underline break-all">https://cometbrew.com/reset-password?token=882910293847</span>
          </p>
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-900/50 p-6 border-t border-neutral-100 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-400">
            Â© 2024 CometBrew. Security Team.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
