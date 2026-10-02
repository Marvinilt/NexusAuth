import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import passport from 'passport';
import { authRequired } from '../middlewares/auth.middleware';
import { clientAuthMiddleware } from '../middlewares/clientAuth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', clientAuthMiddleware, authController.register);
router.post('/login', clientAuthMiddleware, authController.login);

// Google OAuth
router.get('/google', clientAuthMiddleware, (req, res, next) => {
    const state = Buffer.from(JSON.stringify({ clientId: req.client!.id })).toString('base64');
    passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account', state })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

// Facebook OAuth
router.get('/facebook', clientAuthMiddleware, (req, res, next) => {
    const state = Buffer.from(JSON.stringify({ clientId: req.client!.id })).toString('base64');
    passport.authenticate('facebook', { scope: ['email', 'public_profile'], session: false, state })(req, res, next);
});
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

// GitHub OAuth
router.get('/github', clientAuthMiddleware, (req, res, next) => {
    const state = Buffer.from(JSON.stringify({ clientId: req.client!.id })).toString('base64');
    passport.authenticate('github', { scope: ['user:email'], session: false, state })(req, res, next);
});
router.get('/github/callback', passport.authenticate('github', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

// History
router.get('/history', authRequired, authController.getHistory);

export default router;
