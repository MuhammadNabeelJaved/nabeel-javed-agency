import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, ShieldCheck, ShieldOff, Key, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { twoFactorApi } from '../api/twoFactor.api';

type Step = 'loading' | 'idle' | 'setup' | 'enabled' | 'disabling' | 'backup';

export function TwoFactorSetup() {
    const [step, setStep] = useState<Step>('loading');
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [totpInput, setTotpInput] = useState('');
    const [backupCodes, setBackupCodes] = useState<string[]>([]);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        twoFactorApi.getStatus()
            .then(({ twoFactorEnabled }) => setStep(twoFactorEnabled ? 'enabled' : 'idle'))
            .catch(() => setStep('idle'));
    }, []);

    const handleSetup = async () => {
        setBusy(true);
        try {
            const data = await twoFactorApi.setup();
            setQrCode(data.qrCode);
            setSecret(data.manualEntry);
            setTotpInput('');
            setStep('setup');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleVerify = async () => {
        if (totpInput.length !== 6) {
            toast.error('Enter the 6-digit code');
            return;
        }
        setBusy(true);
        try {
            const { backupCodes: codes } = await twoFactorApi.verify(totpInput);
            setBackupCodes(codes);
            setStep('backup');
            toast.success('2FA enabled successfully!');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleDisable = async () => {
        if (!totpInput || !password) {
            toast.error('TOTP code and password are required');
            return;
        }
        setBusy(true);
        try {
            await twoFactorApi.disable(totpInput, password);
            setTotpInput('');
            setPassword('');
            setStep('idle');
            toast.success('2FA disabled');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const handleViewBackupCodes = async () => {
        setBusy(true);
        try {
            const { backupCodes: codes } = await twoFactorApi.getBackupCodes();
            setBackupCodes(codes);
            setStep('backup');
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setBusy(false);
        }
    };

    const copyAll = () => {
        navigator.clipboard.writeText(backupCodes.join('\n'));
        toast.success('Backup codes copied');
    };

    if (step === 'loading') {
        return <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />;
    }

    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card/70 p-5">
            <div className="flex items-center gap-3">
                {step === 'enabled' || step === 'backup' || step === 'disabling'
                    ? <ShieldCheck size={20} className="text-emerald-500" />
                    : <Shield size={20} className="text-muted-foreground" />
                }
                <div>
                    <div className="text-sm font-medium text-foreground">Two-Factor Authentication</div>
                    <div className="text-xs text-muted-foreground">
                        {step === 'enabled' || step === 'backup' || step === 'disabling'
                            ? '2FA is active and your account has an extra security layer'
                            : 'Add an extra layer of security to your account'}
                    </div>
                </div>
                {(step === 'enabled' || step === 'backup' || step === 'disabling') && (
                    <span className="ml-auto rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                        Active
                    </span>
                )}
            </div>

            <AnimatePresence mode="wait">
                {step === 'idle' && (
                    <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <button
                            onClick={handleSetup}
                            disabled={busy}
                            className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                        >
                            <Shield size={14} />
                            {busy ? 'Preparing...' : 'Set Up 2FA'}
                        </button>
                    </motion.div>
                )}

                {step === 'setup' && (
                    <motion.div key="setup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Scan this QR code with your authenticator app.
                        </div>
                        {qrCode && (
                            <img src={qrCode} alt="QR Code" className="mx-auto block h-44 w-44 rounded-xl bg-white p-2" />
                        )}
                        <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                            <div className="mb-1 text-xs text-muted-foreground">Manual entry key:</div>
                            <div className="break-all font-mono text-sm text-foreground">{secret}</div>
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Enter the 6-digit code from your app:</label>
                            <div className="flex gap-3">
                                <input
                                    value={totpInput}
                                    onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    placeholder="000000"
                                    className="w-36 rounded-xl border border-input bg-background px-4 py-2.5 text-center font-mono text-lg tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    onClick={handleVerify}
                                    disabled={busy || totpInput.length !== 6}
                                    className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
                                >
                                    {busy ? 'Verifying...' : 'Enable 2FA'}
                                </button>
                            </div>
                        </div>
                        <button onClick={() => setStep('idle')} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                            Cancel
                        </button>
                    </motion.div>
                )}

                {step === 'backup' && (
                    <motion.div key="backup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                            Save these backup codes somewhere safe. Each code can only be used once.
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {backupCodes.map((code, i) => (
                                <div key={i} className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-center font-mono text-sm text-foreground">
                                    {code}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={copyAll}
                                className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                            >
                                <Copy size={12} />
                                Copy All
                            </button>
                            <button
                                onClick={() => {
                                    setStep('enabled');
                                    setBackupCodes([]);
                                }}
                                className="rounded-xl bg-violet-600 px-4 py-2 text-sm text-white transition-colors hover:bg-violet-500"
                            >
                                Done
                            </button>
                        </div>
                    </motion.div>
                )}

                {step === 'enabled' && (
                    <motion.div key="enabled" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-3">
                        <button
                            onClick={handleViewBackupCodes}
                            disabled={busy}
                            className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-accent"
                        >
                            <Key size={12} />
                            View Backup Codes
                        </button>
                        <button
                            onClick={() => {
                                setTotpInput('');
                                setPassword('');
                                setStep('disabling');
                            }}
                            className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-600/15 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-600/20 dark:text-red-400"
                        >
                            <ShieldOff size={12} />
                            Disable 2FA
                        </button>
                    </motion.div>
                )}

                {step === 'disabling' && (
                    <motion.div key="disabling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        <div className="text-sm text-muted-foreground">
                            Enter your current authenticator code and password to disable 2FA.
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">6-digit TOTP code (or backup code)</label>
                            <input
                                value={totpInput}
                                onChange={(e) => setTotpInput(e.target.value.replace(/[^0-9A-Z]/gi, '').slice(0, 8).toUpperCase())}
                                placeholder="000000"
                                className="w-40 rounded-xl border border-input bg-background px-4 py-2.5 text-center font-mono text-lg tracking-widest text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-xs text-muted-foreground">Current password</label>
                            <div className="relative w-64">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="********"
                                    className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((o) => !o)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDisable}
                                disabled={busy}
                                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
                            >
                                <ShieldOff size={14} />
                                {busy ? 'Disabling...' : 'Disable 2FA'}
                            </button>
                            <button
                                onClick={() => setStep('enabled')}
                                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-accent"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
