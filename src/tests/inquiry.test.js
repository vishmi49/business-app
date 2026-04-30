const request = require('supertest');
const app = require('../app');
const Inquiry = require('../models/inquiry.model');
const emailUtils = require('../utils/email');

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../models/inquiry.model');
jest.mock('../utils/email');

// ── POST /api/inquiries ──────────────────────────────────────────────────────
describe('POST /api/inquiries', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if name is missing', async () => {
    const res = await request(app).post('/api/inquiries').send({
      contactNumber: '0771234567',
      email: 'john@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Name, contact number and email are required'
    );
  });

  it('should return 400 if contact number is missing', async () => {
    const res = await request(app).post('/api/inquiries').send({
      name: 'John Smith',
      email: 'john@example.com',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Name, contact number and email are required'
    );
  });

  it('should return 400 if email is missing', async () => {
    const res = await request(app).post('/api/inquiries').send({
      name: 'John Smith',
      contactNumber: '0771234567',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Name, contact number and email are required'
    );
  });

  it('should return 400 if email format is invalid', async () => {
    Inquiry.create.mockRejectedValue({
      name: 'ValidationError',
      errors: {
        email: { message: 'Please provide a valid email address' },
      },
    });

    const res = await request(app).post('/api/inquiries').send({
      name: 'John Smith',
      contactNumber: '0771234567',
      email: 'notanemail',
    });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Please provide a valid email address');
  });

  it('should return 201 if all required fields are provided', async () => {
    const mockInquiry = {
      _id: '507f1f77bcf86cd799439011',
      name: 'John Smith',
      companyName: 'Smith & Co',
      contactNumber: '0771234567',
      email: 'john@smithco.com',
      description: '<p>We need 100 T-shirts</p>',
    };

    Inquiry.create.mockResolvedValue(mockInquiry);
    emailUtils.sendInquiryNotification.mockResolvedValue(true);

    const res = await request(app).post('/api/inquiries').send({
      name: 'John Smith',
      companyName: 'Smith & Co',
      contactNumber: '0771234567',
      email: 'john@smithco.com',
      description: '<p>We need 100 T-shirts</p>',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Inquiry submitted successfully');
  });

  it('should return 201 without optional fields', async () => {
    const mockInquiry = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Jane Doe',
      contactNumber: '0779876543',
      email: 'jane@example.com',
    };

    Inquiry.create.mockResolvedValue(mockInquiry);
    emailUtils.sendInquiryNotification.mockResolvedValue(true);

    const res = await request(app).post('/api/inquiries').send({
      name: 'Jane Doe',
      contactNumber: '0779876543',
      email: 'jane@example.com',
    });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Inquiry submitted successfully');
  });

  it('should call sendInquiryNotification after saving inquiry', async () => {
    const mockInquiry = {
      _id: '507f1f77bcf86cd799439013',
      name: 'John Smith',
      contactNumber: '0771234567',
      email: 'john@example.com',
    };

    Inquiry.create.mockResolvedValue(mockInquiry);
    emailUtils.sendInquiryNotification.mockResolvedValue(true);

    await request(app).post('/api/inquiries').send({
      name: 'John Smith',
      contactNumber: '0771234567',
      email: 'john@example.com',
    });

    expect(emailUtils.sendInquiryNotification).toHaveBeenCalledWith(
      mockInquiry
    );
  });
});
