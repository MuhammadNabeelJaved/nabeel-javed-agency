/**
 * OAuth callback handler — shared by Google and GitHub strategies.
 *
 * Three possible outcomes after Passport authenticates the user:
 *
 *  1. Error (Passport rejected)     → redirect to OAUTH_FAILURE_REDIRECT?error=<code>
 *  2. New signup (unverified)       → send OTP email, redirect with requiresVerification=true
 *  3. Verified existing user        → issue JWT cookies, redirect to /oauth-callback with user params
 */
import { generateTokens } from "../../utils/generateTokens.js";
import { sendVerificationEmail } from "../../utils/sendEmails.js";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    // 'Lax' is required for OAuth callbacks: the browser arrives at our callback
    // URL via a cross-origin redirect from Google/GitHub, so 'Strict' cookies
    // would be silently dropped.
    sameSite: "Lax",
};

/**
 * Shared handler called after Passport verifies the OAuth user.
 *
 * Passport attaches the resolved user (or false + info.message on failure)
 * before this handler is reached — the oauthCallback wrapper in user.route.js
 * handles the failure redirect so `req.user` is always set here.
 */
const handleOAuthSuccess = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.redirect(
                `${process.env.OAUTH_FAILURE_REDIRECT}?error=oauth_failed`
            );
        }

        // ── New signup — account created but email not yet verified ──────────
        if (!user.isVerified) {
            // generateVerificationCode() is async — it saves the code/expiry to
            // the user doc internally and returns the plain 6-digit code.
            // BUG-FIX: must await this, otherwise verificationCode is a Promise.
            const verificationCode = await user.generateVerificationCode();

            // Non-blocking email — a Resend failure must never break the redirect
            Promise.allSettled([
                sendVerificationEmail({
                    to:   user.email,
                    name: user.name,
                    code: verificationCode,
                }),
            ]).then(([result]) => {
                if (result.status === "rejected") {
                    console.error("[OAuth] Verification email failed:", result.reason?.message);
                }
            });

            const params = new URLSearchParams({
                email:                user.email,
                requiresVerification: "true",
            });
            return res.redirect(
                `${process.env.OAUTH_SUCCESS_REDIRECT}?${params.toString()}`
            );
        }

        // ── Verified existing user — issue tokens and redirect ────────────────
        const { accessToken, refreshToken } = await generateTokens(user);

        res.cookie("accessToken", accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });
        res.cookie("refreshToken", refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Pass only safe display fields — never put tokens in the URL
        const params = new URLSearchParams({
            userId:     String(user._id),
            name:       user.name || user.email.split("@")[0],
            email:      user.email,
            role:       user.role || "user",
            photo:      user.photo || "",
            isVerified: String(user.isVerified),
        });

        return res.redirect(
            `${process.env.OAUTH_SUCCESS_REDIRECT}?${params.toString()}`
        );
    } catch (err) {
        console.error("[OAuth] Callback error:", err);
        return res.redirect(
            `${process.env.OAUTH_FAILURE_REDIRECT}?error=oauth_failed`
        );
    }
};

export const handleGoogleCallback = handleOAuthSuccess;
export const handleGitHubCallback = handleOAuthSuccess;
