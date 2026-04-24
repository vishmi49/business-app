const request = require('supertest');
const app = require('../app');
const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');

// ── Mock the entire Admin model ─────────────────────────────────────────────
jest.mock('../models/admin.model');

// ── Mock jsonwebtoken ───────────────────────────────────────────────────────
jest.mock('jsonwebtoken');

// ── Test data ───────────────────────────────────────────────────────────────
const mockAdmin = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Test Admin',
  email: 'test@example.com',
  comparePassword: jest.fn(),
};

// ── POST /api/auth/login ─────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email or password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email and password are required');
  });

  it('should return 401 if admin is not found', async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should return 401 if password does not match', async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockAdmin),
    });
    mockAdmin.comparePassword.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials');
  });

  it('should return 200 and set cookie on successful login', async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockAdmin),
    });
    mockAdmin.comparePassword.mockResolvedValue(true);
    jwt.sign.mockReturnValue('mock-token');

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.admin.email).toBe('test@example.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

// ── POST /api/auth/logout ────────────────────────────────────────────────────
describe('POST /api/auth/logout', () => {
  it('should return 200 and clear the cookie', async () => {
    const res = await request(app).post('/api/auth/logout');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Logged out successfully');
  });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Email is required');
  });

  it('should return 200 even if email is not registered', async () => {
    Admin.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe(
      'If that email is registered, a reset link has been sent'
    );
  });

  it('should return 200 and save reset token if email exists', async () => {
    const mockAdminWithSave = {
      ...mockAdmin,
      save: jest.fn().mockResolvedValue(true),
      passwordResetToken: null,
      passwordResetExpires: null,
    };
    Admin.findOne.mockResolvedValue(mockAdminWithSave);

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'test@example.com' });

    expect(res.status).toBe(200);
    expect(mockAdminWithSave.save).toHaveBeenCalled();
  });
});

// ── POST /api/auth/reset-password/:token ─────────────────────────────────────
describe('POST /api/auth/reset-password/:token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/sometoken')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('New password is required');
  });

  it('should return 400 if token is invalid or expired', async () => {
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .post('/api/auth/reset-password/invalidtoken')
      .send({ password: 'NewPass1' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Token is invalid or has expired');
  });

  it('should return 200 and reset password with valid token', async () => {
    const mockAdminWithSave = {
      ...mockAdmin,
      password: 'oldhashedpassword',
      passwordResetToken: 'hashedtoken',
      passwordResetExpires: Date.now() + 3600000,
      save: jest.fn().mockResolvedValue(true),
    };
    Admin.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockAdminWithSave),
    });

    const res = await request(app)
      .post('/api/auth/reset-password/validtoken')
      .send({ password: 'NewPass1' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Password reset successful');
    expect(mockAdminWithSave.save).toHaveBeenCalled();
  });
});
