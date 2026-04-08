import { Router } from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    deleteUser,
    getAllUserProfile,
    updateUserProfile,
    updateUserPassword,
    forgotPassword,
    resetPassword,
    verifyUserEmail,
    resendVerificationEmail,
    refreshAccessToken,
    getPublicTeamMembers,
    adminCreateTeamMember,
} from '../../controllers/usersControllers/user.controller.js';
import { handleGoogleCallback, handleGitHubCallback } from '../../controllers/usersControllers/oauth.controller.js';
import { userAuthenticated, authorizeRoles } from '../../middlewares/Auth.js';
import upload from '../../middlewares/multer.js';
import { authLimiter, otpLimiter, uploadLimiter, mutationLimiter } from '../../middlewares/rateLimiter.js';
import {
    registerSchema,
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    updateProfileSchema,
    mongoIdParam,
    validate,
} from '../../middlewares/validate.js';
import passport from 'passport';

const router = Router();

// ── OAuth Routes (Google & GitHub) ───────────────────────────────────────────
// These are GET browser-navigation routes — no body validators, no rate limiter

// Guard: if a provider's credentials aren't configured, redirect to failure URL
const requireOAuthProvider = (envKey) => (req, res, next) => {
    const val = process.env[envKey];
    if (!val || val.startsWith('your_')) {
        return res.redirect(process.env.OAUTH_FAILURE_REDIRECT || '/login?error=oauth_failed');
    }
    next();
};

/**
 * Build a custom Passport callback that forwards Passport's `info.message`
 * (e.g. "account_not_found") as an `?error=` param on the failure redirect,
 * so the frontend can show the right toast without needing server-side sessions.
 */
const oauthCallback = (strategy) => (req, res, next) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            const code = info?.message || 'oauth_failed';
            const base = process.env.OAUTH_FAILURE_REDIRECT || '/oauth-callback';
            return res.redirect(`${base}?error=${encodeURIComponent(code)}`);
        }
        req.user = user;
        next();
    })(req, res, next);
};

// Initiate Google OAuth — ?mode=login (default) or ?mode=signup
// The mode value is forwarded as the OAuth `state` parameter and read back
// in the strategy's passReqToCallback verify function via req.query.state.
router.get('/auth/google',
    requireOAuthProvider('GOOGLE_CLIENT_ID'),
    (req, res, next) => {
        const mode = req.query.mode === 'signup' ? 'signup' : 'login';
        passport.authenticate('google', { scope: ['profile', 'email'], session: false, state: mode })(req, res, next);
    }
);
router.get('/auth/google/callback',
    requireOAuthProvider('GOOGLE_CLIENT_ID'),
    oauthCallback('google'),
    handleGoogleCallback
);

// Initiate GitHub OAuth — ?mode=login (default) or ?mode=signup
router.get('/auth/github',
    requireOAuthProvider('GITHUB_CLIENT_ID'),
    (req, res, next) => {
        const mode = req.query.mode === 'signup' ? 'signup' : 'login';
        passport.authenticate('github', { scope: ['user:email'], session: false, state: mode })(req, res, next);
    }
);
router.get('/auth/github/callback',
    requireOAuthProvider('GITHUB_CLIENT_ID'),
    oauthCallback('github'),
    handleGitHubCallback
);

// Public routes (no auth required)
router.post('/register', authLimiter, uploadLimiter, upload.single('avatar'), registerSchema, registerUser);
router.post('/login', authLimiter, loginSchema, loginUser);
router.post('/verify', otpLimiter, verifyUserEmail);
router.post('/resend-verification', otpLimiter, resendVerificationEmail);
router.post('/forgot-password', authLimiter, forgotPasswordSchema, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPasswordSchema, resetPassword);
router.post('/refresh-token', refreshAccessToken);
router.get('/team', getPublicTeamMembers);

// Protected routes
router.post('/logout', userAuthenticated, logoutUser);
router.get('/', userAuthenticated, authorizeRoles('admin'), getAllUserProfile);
router.post('/create-team-member', userAuthenticated, authorizeRoles('admin'), uploadLimiter, upload.single('avatar'), adminCreateTeamMember);
router.get('/profile/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), validate([mongoIdParam('id')]), getUserProfile);
router.put('/update/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), uploadLimiter, upload.single('avatar'), updateProfileSchema, updateUserProfile);
router.put('/update-password/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), mutationLimiter, validate([mongoIdParam('id')]), updateUserPassword);
router.delete('/:id', userAuthenticated, authorizeRoles('admin', 'user', 'team'), mutationLimiter, validate([mongoIdParam('id')]), deleteUser);

export default router;
