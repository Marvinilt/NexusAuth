import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { prisma } from './prisma';
import { config } from './env';
import { Provider } from '@prisma/client';
import { logger } from './logger';

export const configurePassport = () => {
    // Google Strategy
    passport.use(
        new GoogleStrategy(
            {
                clientID: config.googleClientId || 'mock_client_id',
                clientSecret: config.googleClientSecret || 'mock_client_secret',
                callbackURL: config.googleCallbackUrl || 'http://localhost:3000/auth/google/callback',
            },
            async (accessToken, refreshToken, profile: GoogleProfile, done) => {
                try {
                    let user = await findOrCreateSocialUser(profile, Provider.GOOGLE);
                    return done(null, user);
                } catch (error) {
                    logger.error(`Google Strategy Error: ${error}`);
                    return done(error, undefined);
                }
            }
        )
    );

    // Facebook Strategy
    passport.use(
        new FacebookStrategy(
            {
                clientID: config.facebookAppId || 'mock_app_id',
                clientSecret: config.facebookAppSecret || 'mock_app_secret',
                callbackURL: config.facebookCallbackUrl || 'http://localhost:3000/auth/facebook/callback',
                profileFields: ['id', 'emails', 'name']
            },
            async (accessToken, refreshToken, profile: FacebookProfile, done) => {
                try {
                    let user = await findOrCreateSocialUser(profile, Provider.FACEBOOK);
                    return done(null, user);
                } catch (error) {
                    logger.error(`Facebook Strategy Error: ${error}`);
                    return done(error, undefined);
                }
            }
        )
    );
};

const findOrCreateSocialUser = async (profile: any, provider: Provider) => {
    const email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    const providerId = profile.id;

    if (!email) {
        throw new Error('Email not provided by identity provider');
    }

    // Check if the OAuth Provider connection already exists
    const existingProvider = await prisma.oAuthProvider.findUnique({
        where: {
            provider_providerId: {
                provider,
                providerId,
            },
        },
        include: { user: true },
    });

    if (existingProvider) {
        return existingProvider.user;
    }

    // Check if a user with this email already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        // Create a new user if it doesn't exist
        user = await prisma.user.create({
            data: {
                email,
            },
        });
    }

    // Link the provider to the user
    await prisma.oAuthProvider.create({
        data: {
            provider,
            providerId,
            userId: user.id,
        },
    });

    return user;
};
