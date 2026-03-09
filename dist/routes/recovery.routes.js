"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recovery_controller_1 = require("../controllers/recovery.controller");
const router = (0, express_1.Router)();
const recoveryController = new recovery_controller_1.RecoveryController();
router.post('/forgot-password', recoveryController.sendEmail);
router.post('/reset-password', recoveryController.resetPassword);
exports.default = router;
