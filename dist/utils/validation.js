"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordComplexity = exports.validateEmail = void 0;
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};
exports.validateEmail = validateEmail;
const validatePasswordComplexity = (password) => {
    if (password.length < 12) {
        return { valid: false, message: 'Password must be at least 12 characters long.' };
    }
    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
        return { valid: false, message: 'Password must contain at least 1 number.' };
    }
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasSymbol) {
        return { valid: false, message: 'Password must contain at least 1 symbol.' };
    }
    return { valid: true };
};
exports.validatePasswordComplexity = validatePasswordComplexity;
