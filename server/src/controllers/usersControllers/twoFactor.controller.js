/**
 * Two-Factor Authentication Controller (TOTP)
 *
 * Flow:
 *   1. POST /setup    — generates a secret + QR code URL, stores secret (pending)
 *   2. POST /verify   — verifies first TOTP code, enables 2FA, returns backup codes
 *   3. POST /disable  — disables 2FA (requires current TOTP or backup code + password)
 *   4. POST /validate — called during login when 2FA is enabled (returns final JWT)
 *   5. GET  /status   — returns { twoFactorEnabled }
 */

import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import asyncHandler from '../../middlewares/asyncHandler.js';
import AppError from '../../utils/AppError.js';
import { successResponse } from '../../utils/apiResponse.js';
import User from '../../models/usersModels/User.model.js';
import { generateTokens } from '../../utils/generateTokens.js';
import { scheduleInactivityFollowup } from '../../utils/emailAutomationService.js';

const APP_NAME = 'Nabeel Agency';

// ─── Step 1: Generate secret + QR code ────────────────────────────────────────
export const setup2FA = asyncHandler(async (req, res) => {
    const secret = speakeasy.generateSecret({
        name: `${APP_NAME} (${req.user.email})`,
        issuer: APP_NAME,
        length: 20,
    });

    // Use findById + save to guarantee the field is written (findByIdAndUpdate
    // can skip validators but may also skip certain write paths on some configs)
    const user = await User.findById(req.user._id);
    if (!user) throw new AppError('User not found', 404);
    user.twoFactorSecret = secret.base32;
    user.twoFactorEnabled = false;
    await user.save({ validateBeforeSave: false });

    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    successResponse(res, '2FA setup initiated', {
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntry: secret.base32,
    });
});

// ─── Step 2: Verify first TOTP + enable ───────────────────────────────────────
export const verify2FA = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) throw new AppError('TOTP token is required', 400);

    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user || !user.twoFactorSecret) {
        throw new AppError('2FA setup not initiated. Call /setup first.', 400);
    }

    const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: String(token).trim(),
        window: 2, // Allow ±60s clock skew
    });

    if (!isValid) throw new AppError('Invalid code. Make sure your device clock is correct and try again.', 400);

    // Generate 10 single-use backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
    );

    user.twoFactorEnabled   = true;
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    successResponse(res, '2FA enabled successfully', { backupCodes });
});

// ─── Step 3: Disable 2FA ──────────────────────────────────────────────────────
export const disable2FA = asyncHandler(async (req, res) => {
    const { token, password } = req.body;

    const user = await User.findById(req.user._id)
        .select('+twoFactorSecret +twoFactorBackupCodes +password');

    if (!user || !user.twoFactorEnabled) {
        throw new AppError('2FA is not enabled on this account', 400);
    }

    // Require either a valid TOTP token or a valid backup code + current password
    const totpValid = token && speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: String(token).trim(),
        window: 2,
    });

    const backupIndex = !totpValid && token
        ? user.twoFactorBackupCodes.indexOf(token.toUpperCase())
        : -1;

    if (!totpValid && backupIndex === -1) {
        throw new AppError('Invalid TOTP code or backup code', 400);
    }

    // Also verify password
    if (!password) throw new AppError('Current password is required to disable 2FA', 400);
    const passwordOk = await user.comparePassword(password);
    if (!passwordOk) throw new AppError('Incorrect password', 401);

    if (backupIndex !== -1) {
        // Consume the backup code
        user.twoFactorBackupCodes.splice(backupIndex, 1);
    }

    user.twoFactorEnabled   = false;
    user.twoFactorSecret    = undefined;
    user.twoFactorBackupCodes = [];
    await user.save({ validateBeforeSave: false });

    successResponse(res, '2FA disabled successfully', null);
});

// ─── Step 4: Validate TOTP during login ───────────────────────────────────────
// Called after successful password check when twoFactorEnabled === true.
// Expects a pending session context — userId stored in a short-lived cookie.
export const validate2FA = asyncHandler(async (req, res) => {
    const { token, userId } = req.body;

    if (!token || !userId) throw new AppError('token and userId are required', 400);

    const user = await User.findById(userId)
        .select('+twoFactorSecret +twoFactorBackupCodes');

    if (!user || !user.twoFactorEnabled) {
        throw new AppError('2FA not enabled or user not found', 400);
    }

    // Try TOTP
    const totpValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: String(token).trim(),
        window: 2,
    });

    // Try backup code
    const backupIndex = !totpValid
        ? user.twoFactorBackupCodes.indexOf(token.toUpperCase())
        : -1;

    if (!totpValid && backupIndex === -1) {
        throw new AppError('Invalid 2FA code', 401);
    }

    if (backupIndex !== -1) {
        user.twoFactorBackupCodes.splice(backupIndex, 1);
        await user.save({ validateBeforeSave: false });
    }

    // Issue full auth tokens (generateTokens already saves refreshToken to user doc)
    user.lastLoginAt = new Date();
    const { accessToken, refreshToken } = await generateTokens(user);

    const COOKIE_OPTS = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    };

    res.cookie('accessToken',  accessToken,  { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
    res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 });

    const userObj = user.toObject();
    delete userObj.twoFactorSecret;
    delete userObj.twoFactorBackupCodes;
    delete userObj.password;

    scheduleInactivityFollowup(user).catch(() => {});

    successResponse(res, '2FA verified, login successful', { user: userObj, accessToken });
});

// ─── GET /status ──────────────────────────────────────────────────────────────
export const get2FAStatus = asyncHandler(async (req, res) => {
    successResponse(res, '2FA status', {
        twoFactorEnabled: req.user.twoFactorEnabled || false,
    });
});

// ─── GET /backup-codes ────────────────────────────────────────────────────────
export const getBackupCodes = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+twoFactorBackupCodes');
    if (!user?.twoFactorEnabled) throw new AppError('2FA is not enabled', 400);
    successResponse(res, 'Backup codes', { backupCodes: user.twoFactorBackupCodes });
});

// ─── POST /regenerate-backup-codes ────────────────────────────────────────────
export const regenerateBackupCodes = asyncHandler(async (req, res) => {
    const { token } = req.body;
    const user = await User.findById(req.user._id).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!user?.twoFactorEnabled) throw new AppError('2FA is not enabled', 400);

    const isValid = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: String(token).trim(),
        window: 2,
    });
    if (!isValid) throw new AppError('Invalid code. Make sure your device clock is correct and try again.', 400);

    const backupCodes = Array.from({ length: 10 }, () =>
        crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    user.twoFactorBackupCodes = backupCodes;
    await user.save({ validateBeforeSave: false });

    successResponse(res, 'Backup codes regenerated', { backupCodes });
});
