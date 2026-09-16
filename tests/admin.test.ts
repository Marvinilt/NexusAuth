import assert from 'node:assert';
import test from 'node:test';
import { generateToken, verifyToken, TokenPayload } from '../src/utils/jwt';
import { config } from '../src/config/env';

test('JWT token generation and verification includes isSuperAdmin correctly', () => {
    const payload: TokenPayload = {
        userId: 'admin-123',
        email: config.superAdminEmail,
        clientId: 'client-test-id',
        isSuperAdmin: true
    };

    const token = generateToken(payload);
    assert.ok(token, 'Token should be generated');

    const decoded = verifyToken(token);
    assert.strictEqual(decoded.userId, 'admin-123');
    assert.strictEqual(decoded.email, config.superAdminEmail);
    assert.strictEqual(decoded.isSuperAdmin, true);
});

test('Regular user token has isSuperAdmin undefined or false', () => {
    const payload: TokenPayload = {
        userId: 'user-456',
        email: 'regular@example.com',
        clientId: 'client-test-id',
        isSuperAdmin: false
    };

    const token = generateToken(payload);
    const decoded = verifyToken(token);
    assert.strictEqual(decoded.isSuperAdmin, false);
});
