const request = require('supertest');
const app = require('../app');
const Order = require('../models/order.model');
const Client = require('../models/client.model');
const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');
const orderNumberUtils = require('../utils/orderNumber');

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../models/order.model');
jest.mock('../models/client.model');
jest.mock('../models/admin.model');
jest.mock('jsonwebtoken');
jest.mock('../utils/orderNumber');

// ── Auth helper ──────────────────────────────────────────────────────────────
const mockAuth = () => {
  jwt.verify.mockReturnValue({ id: '507f1f77bcf86cd799439011' });
  Admin.findById.mockResolvedValue({
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Admin',
    email: 'admin@test.com',
  });
};

// ── Test data ────────────────────────────────────────────────────────────────
const mockOrder = {
  _id: '507f1f77bcf86cd799439022',
  orderNumber: 'ORD-2026-001',
  clientId: '507f1f77bcf86cd799439011',
  quantity: 100,
  sizes: { S: 20, M: 40, L: 30, XL: 10 },
  status: 'pending',
  pricePerUnit: 15.5,
  qualityFailureCount: 0,
  paymentStatus: 'unpaid',
  save: jest.fn().mockResolvedValue(true),
};

const mockClient = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Sarah Johnson',
  companyName: 'Johnson Apparel',
};

// ── POST /api/orders ─────────────────────────────────────────────────────────
describe('POST /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', 'token=mocktoken')
      .send({ quantity: 100 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Client and quantity are required');
  });

  it('should return 404 if client does not exist', async () => {
    Client.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', 'token=mocktoken')
      .send({ clientId: '507f1f77bcf86cd799439011', quantity: 100 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Client not found');
  });

  it('should return 201 and create order with generated order number', async () => {
    Client.findById.mockResolvedValue(mockClient);
    orderNumberUtils.generateOrderNumber.mockResolvedValue('ORD-2026-001');
    Order.create.mockResolvedValue(mockOrder);

    const res = await request(app)
      .post('/api/orders')
      .set('Cookie', 'token=mocktoken')
      .send({
        clientId: '507f1f77bcf86cd799439011',
        quantity: 100,
        pricePerUnit: 15.5,
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Order created successfully');
    expect(res.body.order.orderNumber).toBe('ORD-2026-001');
  });
});

// ── GET /api/orders ──────────────────────────────────────────────────────────
describe('GET /api/orders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 200 and list of orders', async () => {
    Client.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([]),
    });
    Order.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([mockOrder]),
    });

    const res = await request(app)
      .get('/api/orders')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
  });
});

// ── GET /api/orders/:id ──────────────────────────────────────────────────────
describe('GET /api/orders/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if order not found', async () => {
    Order.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get('/api/orders/507f1f77bcf86cd799439022')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('should return 200 with order and calculated totalPrice', async () => {
    Order.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockOrder),
    });

    const res = await request(app)
      .get('/api/orders/507f1f77bcf86cd799439022')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.totalPrice).toBe(100 * 15.5);
  });
});

// ── PATCH /api/orders/:id/status ─────────────────────────────────────────────
describe('PATCH /api/orders/:id/status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 400 if status is missing', async () => {
    const res = await request(app)
      .patch('/api/orders/507f1f77bcf86cd799439022/status')
      .set('Cookie', 'token=mocktoken')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Status is required');
  });

  it('should return 400 if status transition is invalid', async () => {
    Order.findById.mockResolvedValue({ ...mockOrder, status: 'pending' });

    const res = await request(app)
      .patch('/api/orders/507f1f77bcf86cd799439022/status')
      .set('Cookie', 'token=mocktoken')
      .send({ status: 'completed' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("Cannot transition from 'pending'");
  });

  it('should return 200 on valid status transition', async () => {
    const orderWithSave = {
      ...mockOrder,
      status: 'pending',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(orderWithSave);

    const res = await request(app)
      .patch('/api/orders/507f1f77bcf86cd799439022/status')
      .set('Cookie', 'token=mocktoken')
      .send({ status: 'confirmed' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Order status updated successfully');
  });
});

// ── PATCH /api/orders/:id/quality-failure ────────────────────────────────────
describe('PATCH /api/orders/:id/quality-failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 400 if failureCount is missing', async () => {
    const res = await request(app)
      .patch('/api/orders/507f1f77bcf86cd799439022/quality-failure')
      .set('Cookie', 'token=mocktoken')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Failure count is required');
  });

  it('should return 400 if failureCount is negative', async () => {
    const res = await request(app)
      .patch('/api/orders/507f1f77bcf86cd799439022/quality-failure')
      .set('Cookie', 'token=mocktoken')
      .send({ failureCount: -1 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Failure count cannot be negative');
  });

  it('should return 200 and record failure count without changing status', async () => {
    const orderWithSave = {
      ...mockOrder,
      status: 'quality-check',
      save: jest.fn().mockResolvedValue(true),
    };
    Order.findById.mockResolvedValue(orderWithSave);

    const res = await request(app)
      .patch('/api/orders/507f1f77bcf86cd799439022/quality-failure')
      .set('Cookie', 'token=mocktoken')
      .send({ failureCount: 5 });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('5 item(s) failed');
    expect(orderWithSave.status).toBe('quality-check');
  });
});
