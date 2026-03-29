export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePasswordComplexity = (password: string): { valid: boolean; message?: string } => {
    if (password.length < 12) {
        return { valid: false, message: 'La contraseña debe tener al menos 12 caracteres.' };
    }

    const hasNumber = /\d/.test(password);
    if (!hasNumber) {
        return { valid: false, message: 'La contraseña debe contener al menos 1 número.' };
    }

    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (!hasSymbol) {
        return { valid: false, message: 'La contraseña debe contener al menos 1 símbolo especial.' };
    }

    return { valid: true };
};
