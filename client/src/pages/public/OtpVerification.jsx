import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowRight, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const OTP_LENGTH = 6;

export default function OtpVerification() {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    setError('');

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // only last char
    setOtp(newOtp);

    // Auto-advance
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i];
    }
    setOtp(newOtp);
    const focusIdx = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // In production, validate code with your API
    if (code === '000000') {
      setError('Invalid code. Please try again.');
      setIsLoading(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      return;
    }

    navigate('/admin');
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(Array(OTP_LENGTH).fill(''));
    setError('');
    setCanResend(false);
    setResendCountdown(60);
    inputRefs.current[0]?.focus();
    // In production: call resend OTP API
  };

  const isComplete = otp.every((d) => d !== '');

  return (
    <div className="min-h-screen bg-[#030712] text-white flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-violet-600/8 rounded-full blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[200px] bg-purple-500/6 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="rounded-3xl border border-white/8 bg-white/[0.03] backdrop-blur-xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-500/20 rounded-2xl blur-lg" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/30 to-purple-600/20 border border-violet-500/30 flex items-center justify-center">
                <Shield className="h-8 w-8 text-violet-300" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Verify Your Identity
            </h1>
            <p className="text-sm text-gray-400 leading-relaxed">
              We sent a 6-digit verification code to your registered email
              address. Enter it below to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* OTP Input */}
            <div className="flex gap-2.5 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <motion.input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border bg-white/[0.05] text-white focus:outline-none transition-all duration-200 caret-transparent ${
                    error
                      ? 'border-red-500/50 bg-red-500/5 focus:ring-1 focus:ring-red-500/30'
                      : digit
                      ? 'border-violet-500/50 bg-violet-500/8 focus:ring-1 focus:ring-violet-500/40'
                      : 'border-white/10 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30'
                  }`}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 text-sm text-red-400 mb-5"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              variant="glow"
              size="lg"
              isLoading={isLoading}
              className="w-full shadow-xl shadow-violet-500/20 mb-5"
            >
              {isLoading ? 'Verifying...' : 'Verify Code'}
              {!isLoading && <ArrowRight className="h-4 w-4" />}
            </Button>

            {/* Resend */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  className="inline-flex items-center gap-1.5 text-sm text-violet-400 hover:text-violet-300 transition-colors font-medium"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Resend code
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend code in{' '}
                  <span className="text-gray-300 font-mono">
                    {String(Math.floor(resendCountdown / 60)).padStart(2, '0')}:
                    {String(resendCountdown % 60).padStart(2, '0')}
                  </span>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-600 mt-5"
        >
          Having trouble?{' '}
          <a
            href="mailto:support@nabelagency.com"
            className="text-violet-400 hover:underline"
          >
            Contact support
          </a>
        </motion.p>
      </motion.div>
    </div>
  );
}
