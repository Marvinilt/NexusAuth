export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePasswordComplexity = (password: string): { valid: boolean; message?: string } => {
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
