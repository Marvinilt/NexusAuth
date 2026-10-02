import assert from 'node:assert';
import test from 'node:test';
import { validateEmail, validatePasswordComplexity } from '../src/utils/validation';

test('validateEmail validates valid and invalid email formats', () => {
    assert.strictEqual(validateEmail('user@test.com'), true);
    assert.strictEqual(validateEmail('invalid-email'), false);
    assert.strictEqual(validateEmail(''), false);
    assert.strictEqual(validateEmail('user@domain'), false);
});

test('validatePasswordComplexity requires at least 12 chars, 1 number, and 1 symbol', () => {
    // Too short
    const short = validatePasswordComplexity('Short1!');
    assert.strictEqual(short.valid, false);
    assert.strictEqual(short.message, 'La contraseña debe tener al menos 12 caracteres.');

    // No number
    const noNumber = validatePasswordComplexity('NoNumberPassword!');
    assert.strictEqual(noNumber.valid, false);
    assert.strictEqual(noNumber.message, 'La contraseña debe contener al menos 1 número.');

    // No symbol
    const noSymbol = validatePasswordComplexity('NoSymbolPassword123');
    assert.strictEqual(noSymbol.valid, false);
    assert.strictEqual(noSymbol.message, 'La contraseña debe contener al menos 1 símbolo especial.');

    // Valid
    const valid = validatePasswordComplexity('ValidP@ssword123');
    assert.strictEqual(valid.valid, true);
    assert.strictEqual(valid.message, undefined);
});
