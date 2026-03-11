import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import passport from 'passport';
import { authRequired } from '../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

// Facebook OAuth
router.get('/facebook', passport.authenticate('facebook', { scope: ['email', 'public_profile'], session: false }));
router.get('/facebook/callback', passport.authenticate('facebook', { session: false, failureRedirect: '/login' }), authController.oauthCallback);

// History
router.get('/history', authRequired, authController.getHistory);

export default router;
