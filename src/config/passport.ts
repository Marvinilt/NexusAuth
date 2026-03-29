import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from 'passport-facebook';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { prisma } from './prisma';
import { config } from './env';
import { Provider } from '@prisma/client';
import { logger } from './logger';
import axios from 'axios';

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

    // GitHub Strategy
    passport.use(
        new GitHubStrategy(
            {
                clientID: config.githubClientId || 'mock_github_client_id',
                clientSecret: config.githubClientSecret || 'mock_github_client_secret',
                callbackURL: config.githubCallbackUrl || 'http://localhost:3000/auth/github/callback',
            },
            async (accessToken: string, refreshToken: string, profile: GitHubProfile, done: any) => {
                try {
                    // GitHub sometimes doesn't return the email even with the user:email scope
                    // if the user has it set to private. We need to fetch it explicitly.
                    let email = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;

                    if (!email && accessToken) {
                        logger.info(`[Passport.GITHUB] Email not in profile, fetching from GitHub API...`);
                        const response = await axios.get('https://api.github.com/user/emails', {
                            headers: {
                                'Authorization': `token ${accessToken}`,
                                'User-Agent': 'NexusAuth'
                            }
                        });

                        if (response.data && Array.isArray(response.data)) {
                            // Find primary verified email or just the first one
                            const primary = response.data.find((e: any) => e.primary && e.verified) ||
                                          response.data.find((e: any) => e.verified) ||
                                          response.data[0];

                            if (primary) {
                                email = primary.email;
                                // Injecting it back into the profile object so findOrCreateSocialUser can pick it up
                                (profile as any).emails = [{ value: email }];
                                logger.info(`[Passport.GITHUB] Found email through API: ${email}`);
                            }
                        }
                    }

                    let user = await findOrCreateSocialUser(profile, Provider.GITHUB);
                    return done(null, user);
                } catch (error) {
                    logger.error(`GitHub Strategy Error: ${error}`);
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
        logger.error(`[Passport.${provider}] Email not provided by identity provider. Profile structure: ${JSON.stringify(profile)}`);
        throw new Error('Email not provided by identity provider');
    }

    logger.info(`[Passport.${provider}] Checking OAuth provider link for email: ${email}`);
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
        logger.info(`[Passport.${provider}] Existing OAuth provider link found for user ${existingProvider.user.email} (ID: ${existingProvider.user.id})`);
        return existingProvider.user;
    }

    logger.info(`[Passport.${provider}] No existing OAuth link found. Checking for existing local user by email: ${email}`);
    // Check if a user with this email already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        logger.info(`[Passport.${provider}] Local user does not exist. Creating new user account for ${email}`);
        // Create a new user if it doesn't exist
        user = await prisma.user.create({
            data: {
                email,
            },
        });
    } else {
        logger.info(`[Passport.${provider}] Existing local user found for ${email} (ID: ${user.id}). Linking them to ${provider}`);
    }

    // Link the provider to the user
    await prisma.oAuthProvider.create({
        data: {
            provider,
            providerId,
            userId: user.id,
        },
    });

    logger.info(`[Passport.${provider}] Successfully linked ${provider} to user: ${user.id}`);

    return user;
};
