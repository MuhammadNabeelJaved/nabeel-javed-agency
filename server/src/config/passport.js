import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import User from "../models/usersModels/User.model.js";

/**
 * Configure Passport with Google and GitHub OAuth strategies.
 * Uses session: false — this project is stateless JWT-based auth.
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
                    clientID:     process.env.GOOGLE_CLIENT_ID,
                    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                    callbackURL:  process.env.GOOGLE_CALLBACK_URL,
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0]?.value;
                        if (!email) {
                            return done(null, false, { message: "No email returned from Google." });
                        }

                        // Try to find existing user by googleId first, then by email
                        let user = await User.findOne({ googleId: profile.id });

                        if (!user) {
                            user = await User.findOne({ email });

                            if (user) {
                                // Link Google to existing email/password account
                                if (user.deletedAt || !user.isActive) {
                                    return done(null, false, { message: "Account is deactivated." });
                                }
                                user.googleId = profile.id;
                                user.isVerified = true;
                                await user.save({ validateBeforeSave: false });
                            } else {
                                // Create brand-new OAuth user
                                user = await User.create({
                                    name:       profile.displayName || email.split("@")[0],
                                    email,
                                    googleId:   profile.id,
                                    photo:      profile.photos?.[0]?.value || "default.jpg",
                                    role:       "user",
                                    isVerified: true,
                                    isActive:   true,
                                });
                            }
                        } else {
                            if (user.deletedAt || !user.isActive) {
                                return done(null, false, { message: "Account is deactivated." });
                            }
                        }

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
                    clientID:     process.env.GITHUB_CLIENT_ID,
                    clientSecret: process.env.GITHUB_CLIENT_SECRET,
                    callbackURL:  process.env.GITHUB_CALLBACK_URL,
                    scope:        ["user:email"],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0]?.value;
                        if (!email) {
                            return done(null, false, {
                                message: "GitHub email is private. Please make your primary email public in GitHub settings.",
                            });
                        }

                        const githubId = String(profile.id);

                        // Try to find existing user by githubId first, then by email
                        let user = await User.findOne({ githubId });

                        if (!user) {
                            user = await User.findOne({ email });

                            if (user) {
                                // Link GitHub to existing email/password account
                                if (user.deletedAt || !user.isActive) {
                                    return done(null, false, { message: "Account is deactivated." });
                                }
                                user.githubId = githubId;
                                user.isVerified = true;
                                await user.save({ validateBeforeSave: false });
                            } else {
                                // Create brand-new OAuth user
                                user = await User.create({
                                    name:       profile.displayName || profile.username || email.split("@")[0],
                                    email,
                                    githubId,
                                    photo:      profile.photos?.[0]?.value || "default.jpg",
                                    role:       "user",
                                    isVerified: true,
                                    isActive:   true,
                                });
                            }
                        } else {
                            if (user.deletedAt || !user.isActive) {
                                return done(null, false, { message: "Account is deactivated." });
                            }
                        }

                        return done(null, user);
                    } catch (err) {
                        return done(err, false);
                    }
                }
            )
        );
    }
};
