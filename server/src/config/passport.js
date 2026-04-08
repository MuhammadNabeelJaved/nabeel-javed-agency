import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/usersModels/User.model.js";

/**
 * Configure Passport with Google and GitHub OAuth strategies.
 * Uses session: false — this project is stateless JWT-based auth.
 *
 * Mode is passed via the OAuth `state` param (?mode=login|signup on the
 * initiating route, forwarded as state= in the callback query string).
 *
 * LOGIN  mode: user must already exist — never auto-creates an account.
 * SIGNUP mode: user must NOT exist — creates with isVerified:false + OTP.
 *
 * @param {import('express').Application} app
 */
export const configurePassport = (app) => {
    app.use(passport.initialize());

    // ── Google Strategy ───────────────────────────────────────────────────────
    if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('your_')) {
        console.warn('[Passport] Google OAuth disabled — GOOGLE_CLIENT_ID not set in .env');
    } else {
        passport.use(
            new GoogleStrategy(
                {
                    clientID:          process.env.GOOGLE_CLIENT_ID,
                    clientSecret:      process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL:       process.env.GOOGLE_CALLBACK_URL,
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        // state param carries the mode ('login' | 'signup')
                        const mode  = req.query.state || 'login';
                        const email = profile.emails?.[0]?.value;

                        if (!email) {
                            return done(null, false, { message: "no_email" });
                        }

                        // Find by provider ID first, then fall back to email
                        let user = await User.findOne({ googleId: profile.id });
                        if (!user) user = await User.findOne({ email });

                        // ── LOGIN flow ────────────────────────────────────────
                        if (mode === 'login') {
                            if (!user) {
                                return done(null, false, { message: "account_not_found" });
                            }
                            if (user.deletedAt || !user.isActive) {
                                return done(null, false, { message: "account_deactivated" });
                            }
                            // Link Google ID if the user originally signed up with email/password
                            if (!user.googleId) {
                                user.googleId = profile.id;
                                await user.save({ validateBeforeSave: false });
                            }
                            return done(null, user);
                        }

                        // ── SIGNUP flow ───────────────────────────────────────
                        if (user) {
                            if (user.deletedAt || !user.isActive) {
                                return done(null, false, { message: "account_deactivated" });
                            }
                            return done(null, false, { message: "account_exists" });
                        }

                        // Create new user — unverified; oauth.controller will send OTP email
                        user = new User({
                            name:       profile.displayName || email.split("@")[0],
                            email,
                            googleId:   profile.id,
                            provider:   "google",
                            photo:      profile.photos?.[0]?.value || "default.jpg",
                            role:       "user",
                            isVerified: false,
                            isActive:   true,
                        });
                        await user.save();
                        return done(null, user);

                    } catch (err) {
                        return done(err, false);
                    }
                }
            )
        );
    }

    // ── GitHub Strategy ───────────────────────────────────────────────────────
    if (!process.env.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID.startsWith('your_')) {
        console.warn('[Passport] GitHub OAuth disabled — GITHUB_CLIENT_ID not set in .env');
    } else {
        passport.use(
            new GitHubStrategy(
                {
                    clientID:          process.env.GITHUB_CLIENT_ID,
                    clientSecret:      process.env.GITHUB_CLIENT_SECRET,
                    callbackURL:       process.env.GITHUB_CALLBACK_URL,
                    scope:             ["user:email"],
                    passReqToCallback: true,
                },
                async (req, accessToken, refreshToken, profile, done) => {
                    try {
                        const mode    = req.query.state || 'login';
                        const email   = profile.emails?.[0]?.value;
                        const githubId = String(profile.id);

                        if (!email) {
                            return done(null, false, { message: "github_no_email" });
                        }

                        let user = await User.findOne({ githubId });
                        if (!user) user = await User.findOne({ email });

                        // ── LOGIN flow ────────────────────────────────────────
                        if (mode === 'login') {
                            if (!user) {
                                return done(null, false, { message: "account_not_found" });
                            }
                            if (user.deletedAt || !user.isActive) {
                                return done(null, false, { message: "account_deactivated" });
                            }
                            if (!user.githubId) {
                                user.githubId = githubId;
                                await user.save({ validateBeforeSave: false });
                            }
                            return done(null, user);
                        }

                        // ── SIGNUP flow ───────────────────────────────────────
                        if (user) {
                            if (user.deletedAt || !user.isActive) {
                                return done(null, false, { message: "account_deactivated" });
                            }
                            return done(null, false, { message: "account_exists" });
                        }

                        user = new User({
                            name:       profile.displayName || profile.username || email.split("@")[0],
                            email,
                            githubId,
                            provider:   "github",
                            photo:      profile.photos?.[0]?.value || "default.jpg",
                            role:       "user",
                            isVerified: false,
                            isActive:   true,
                        });
                        await user.save();
                        return done(null, user);

                    } catch (err) {
                        return done(err, false);
                    }
                }
            )
        );
    }
};
