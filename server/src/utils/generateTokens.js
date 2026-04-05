import AppError from "./AppError.js";

/**
 * Generates a JWT access token and refresh token for the given user,
 * saves the refresh token to the user document, and returns both.
 *
 * @param {import('mongoose').Document} user - Mongoose User document
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 * @throws {AppError} 404 if user is falsy, 500 on token failure
 */
export const generateTokens = async (user) => {
    try {
        if (!user) {
            throw new AppError("User not found", 404);
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Persist the refresh token so the /refresh-token endpoint can validate it
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        if (error.isOperational || error.name === 'ValidationError' || error.name === 'CastError' || error.code === 11000) throw error;
        throw new AppError(`Token generation failed: ${error.message}`, 500);
    }
};
