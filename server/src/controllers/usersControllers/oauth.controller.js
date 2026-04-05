import { generateTokens } from "../../utils/generateTokens.js";

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // 'Lax' is required for OAuth callbacks: the browser arrives at our callback
    // URL via a cross-origin redirect from Google/GitHub, so 'Strict' cookies
    // would be silently dropped.
    sameSite: "Lax",
};

/**
 * Shared handler called after Passport has verified the OAuth user.
 * Sets JWT cookies and redirects the browser to the frontend callback page
 * with safe user data in query params (tokens stay in HTTP-only cookies).
 */
const handleOAuthSuccess = async (req, res) => {
    try {
        const user = req.user;

        if (!user) {
            return res.redirect(process.env.OAUTH_FAILURE_REDIRECT);
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.cookie("accessToken", accessToken, {
            ...COOKIE_OPTIONS,
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie("refreshToken", refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        // Only safe display fields — never put tokens in the URL
        const params = new URLSearchParams({
            userId:     String(user._id),
            name:       user.name || user.email.split("@")[0],
            email:      user.email,
            role:       user.role || "user",
            photo:      user.photo || "",
            isVerified: String(user.isVerified),
        });

        return res.redirect(`${process.env.OAUTH_SUCCESS_REDIRECT}?${params.toString()}`);
    } catch (err) {
        console.error("OAuth callback error:", err);
        return res.redirect(process.env.OAUTH_FAILURE_REDIRECT);
    }
};

export const handleGoogleCallback = handleOAuthSuccess;
export const handleGitHubCallback = handleOAuthSuccess;
