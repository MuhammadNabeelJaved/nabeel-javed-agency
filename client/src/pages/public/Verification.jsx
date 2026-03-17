import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const OTP_LENGTH = 6;
const RESEND_DELAY = 60;

export default function Verification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const [canResend, setCanResend] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInput = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when filled
    if (value && newOtp.every((d) => d !== '') && index === OTP_LENGTH - 1) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...Array(OTP_LENGTH).fill('')];
    pasted.split('').forEach((char, i) => { newOtp[i] = char; });
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
    if (pasted.length === OTP_LENGTH) handleVerify(pasted);
  };

  const handleVerify = async (code) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);
    setIsVerified(true);
    await new Promise((r) => setTimeout(r, 1500));
    navigate('/admin');
  };

  const handleResend = () => {
    setCountdown(RESEND_DELAY);
    setCanResend(false);
    setOtp(Array(OTP_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (otp.every((d) => d !== '')) handleVerify(otp.join(''));
  };

  const isFilled = otp.every((d) => d !== '');

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-6">
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 50% 40% at 50% 40%, rgba(124,58,237,0.2) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="p-8 rounded-3xl text-center relative overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(124,58,237,0.2)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.15) 0%, transparent 70%)',
            }}
          />

          <AnimatePresence mode="wait">
            {isVerified ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 py-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)' }}
                >
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">Verified!</h2>
                <p className="text-white/50 text-sm">Redirecting you to the dashboard...</p>
              </motion.div>
            ) : (
              <motion.div key="form" className="relative z-10">
                {/* Icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(168,85,247,0.2))',
                    border: '1px solid rgba(124,58,237,0.4)',
                    boxShadow: '0 0 30px rgba(124,58,237,0.25)',
                  }}
                >
                  <Mail className="w-8 h-8 text-violet-400" />
                </div>

                <h1 className="text-3xl font-black text-white mb-2">Verify your email</h1>
                <p className="text-white/50 text-sm mb-1">We sent a 6-digit code to</p>
                <p
                  className="text-sm font-semibold mb-8"
                  style={{ color: '#a78bfa' }}
                >
                  your@email.com
                </p>

                <form onSubmit={handleSubmit}>
                  {/* OTP Inputs */}
                  <div className="flex gap-2 justify-center mb-8" onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <motion.input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleInput(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        whileFocus={{ scale: 1.08 }}
                        className="w-12 h-14 text-center text-xl font-black rounded-xl outline-none transition-all"
                        style={{
                          background: digit ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.06)',
                          border: digit
                            ? '2px solid rgba(124,58,237,0.6)'
                            : '1px solid rgba(255,255,255,0.12)',
                          color: '#fff',
                          boxShadow: digit ? '0 0 12px rgba(124,58,237,0.3)' : 'none',
                        }}
                      />
                    ))}
                  </div>

                  <Button
                    type="submit"
                    variant="glow"
                    size="lg"
                    isLoading={isLoading}
                    disabled={!isFilled || isLoading}
                    className="w-full mb-6"
                  >
                    Verify Email
                  </Button>
                </form>

                {/* Resend */}
                <div className="text-white/40 text-sm">
                  {canResend ? (
                    <button
                      onClick={handleResend}
                      className="flex items-center gap-2 mx-auto text-violet-400 hover:text-violet-300 font-medium transition-colors"
                    >
                      <RefreshCw className="w-4 h-4" /> Resend Code
                    </button>
                  ) : (
                    <span>
                      Resend code in{' '}
                      <span className="text-white font-semibold tabular-nums">
                        0:{String(countdown).padStart(2, '0')}
                      </span>
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Logo below */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a855f7)' }}
          >
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white/30 text-sm">NabeelDev Agency</span>
        </div>
      </motion.div>
    </div>
  );
}
