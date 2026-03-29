"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurePassport = void 0;
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_facebook_1 = require("passport-facebook");
const prisma_1 = require("./prisma");
const env_1 = require("./env");
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const configurePassport = () => {
    // Google Strategy
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: env_1.config.googleClientId || 'mock_client_id',
        clientSecret: env_1.config.googleClientSecret || 'mock_client_secret',
        callbackURL: env_1.config.googleCallbackUrl || 'http://localhost:3000/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await findOrCreateSocialUser(profile, client_1.Provider.GOOGLE);
            return done(null, user);
        }
        catch (error) {
            logger_1.logger.error(`Google Strategy Error: ${error}`);
            return done(error, undefined);
        }
    }));
    // Facebook Strategy
    passport_1.default.use(new passport_facebook_1.Strategy({
        clientID: env_1.config.facebookAppId || 'mock_app_id',
        clientSecret: env_1.config.facebookAppSecret || 'mock_app_secret',
        callbackURL: env_1.config.facebookCallbackUrl || 'http://localhost:3000/auth/facebook/callback',
        profileFields: ['id', 'emails', 'name']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await findOrCreateSocialUser(profile, client_1.Provider.FACEBOOK);
            return done(null, user);
        }
        catch (error) {
            logger_1.logger.error(`Facebook Strategy Error: ${error}`);
            return done(error, undefined);
        }
    }));
};
exports.configurePassport = configurePassport;
const findOrCreateSocialUser = async (profile, provider) => {
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    const providerId = profile.id;
    if (!email) {
        logger_1.logger.error(`[Passport.${provider}] Email not provided by identity provider`);
        throw new Error('Email not provided by identity provider');
    }
    logger_1.logger.info(`[Passport.${provider}] Checking OAuth provider link for email: ${email}`);
    // Check if the OAuth Provider connection already exists
    const existingProvider = await prisma_1.prisma.oAuthProvider.findUnique({
        where: {
            provider_providerId: {
                provider,
                providerId,
            },
        },
        include: { user: true },
    });
    if (existingProvider) {
        logger_1.logger.info(`[Passport.${provider}] Existing OAuth provider link found for user ${existingProvider.user.email} (ID: ${existingProvider.user.id})`);
        return existingProvider.user;
    }
    logger_1.logger.info(`[Passport.${provider}] No existing OAuth link found. Checking for existing local user by email: ${email}`);
    // Check if a user with this email already exists
    let user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        logger_1.logger.info(`[Passport.${provider}] Local user does not exist. Creating new user account for ${email}`);
        // Create a new user if it doesn't exist
        user = await prisma_1.prisma.user.create({
            data: {
                email,
            },
        });
    }
    else {
        logger_1.logger.info(`[Passport.${provider}] Existing local user found for ${email} (ID: ${user.id}). Linking them to ${provider}`);
    }
    // Link the provider to the user
    await prisma_1.prisma.oAuthProvider.create({
        data: {
            provider,
            providerId,
            userId: user.id,
        },
    });
    logger_1.logger.info(`[Passport.${provider}] Successfully linked ${provider} to user: ${user.id}`);
    return user;
};
