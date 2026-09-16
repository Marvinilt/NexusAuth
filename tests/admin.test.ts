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

interface MockRequest {
    headers: { authorization?: string };
    user?: TokenPayload;
}

interface MockResponse {
    status: (code: number) => { json: (body: { error: string }) => void };
}

test('requireSuperAdmin middleware blocks regular users with 403', () => {
    const { requireSuperAdmin } = require('../src/middlewares/superAdmin.middleware');
    let statusCode = 0;
    let responseBody: { error: string } = { error: '' };

    const regularToken = generateToken({
        userId: 'user-789',
        email: 'regular@example.com',
        clientId: 'client-test-id',
        isSuperAdmin: false
    });

    const req: MockRequest = {
        headers: { authorization: `Bearer ${regularToken}` }
    };
    const res: MockResponse = {
        status: (code: number) => {
            statusCode = code;
            return {
                json: (body: { error: string }) => { responseBody = body; }
            };
        }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(nextCalled, false);
    assert.ok(responseBody.error.includes('Super Administrador'));
});

test('requireSuperAdmin middleware allows superadmin users to pass', () => {
    const { requireSuperAdmin } = require('../src/middlewares/superAdmin.middleware');
    let nextCalled = false;

    const superAdminToken = generateToken({
        userId: 'admin-001',
        email: config.superAdminEmail,
        clientId: 'client-test-id',
        isSuperAdmin: true
    });

    const req: MockRequest = {
        headers: { authorization: `Bearer ${superAdminToken}` }
    };
    const res: MockResponse = {
        status: () => ({ json: () => {} })
    };
    const next = () => { nextCalled = true; };

    requireSuperAdmin(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user?.email, config.superAdminEmail);
    assert.strictEqual(req.user?.isSuperAdmin, true);
});
