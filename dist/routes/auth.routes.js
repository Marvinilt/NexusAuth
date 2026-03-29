"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const passport_1 = __importDefault(require("passport"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', authController.register);
router.post('/login', authController.login);
// Google OAuth
router.get('/google', passport_1.default.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), authController.oauthCallback);
// Facebook OAuth
router.get('/facebook', passport_1.default.authenticate('facebook', { scope: ['email', 'public_profile'], session: false }));
router.get('/facebook/callback', passport_1.default.authenticate('facebook', { session: false, failureRedirect: '/login' }), authController.oauthCallback);
// History
router.get('/history', auth_middleware_1.authRequired, authController.getHistory);
exports.default = router;
