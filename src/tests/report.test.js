const request = require('supertest');
const app = require('../app');
const Order = require('../models/order.model');
const Expense = require('../models/expense.model');
const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../models/order.model');
jest.mock('../models/expense.model');
jest.mock('../models/admin.model');
jest.mock('jsonwebtoken');

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
  quantity: 100,
  pricePerUnit: 15.5,
  paidAmount: 1550,
  paymentStatus: 'fully-paid',
};

const mockExpenses = [
  {
    _id: '507f1f77bcf86cd799439033',
    orderId: '507f1f77bcf86cd799439022',
    category: 'material',
    amount: 250.5,
    date: new Date('2026-04-01'),
  },
  {
    _id: '507f1f77bcf86cd799439044',
    orderId: '507f1f77bcf86cd799439022',
    category: 'stitching',
    amount: 180,
    date: new Date('2026-04-05'),
  },
];

// ── GET /api/reports/order/:orderId ──────────────────────────────────────────
describe('GET /api/reports/order/:orderId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if order not found', async () => {
    Order.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(null),
    });

    const res = await request(app)
      .get('/api/reports/order/507f1f77bcf86cd799439022')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('should return 200 with full order report', async () => {
    Order.findById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockOrder),
    });
    Expense.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(mockExpenses),
    });

    const res = await request(app)
      .get('/api/reports/order/507f1f77bcf86cd799439022')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.totalPrice).toBe(1550);
    expect(res.body.totalCost).toBe(430.5);
    expect(res.body.profit).toBe(1119.5);
    expect(res.body.outstanding).toBe(0);
    expect(res.body.expensesByCategory).toEqual({
      material: 250.5,
      stitching: 180,
    });
  });
});

// ── GET /api/reports/summary ─────────────────────────────────────────────────
describe('GET /api/reports/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 400 if no filter provided', async () => {
    const res = await request(app)
      .get('/api/reports/summary')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Provide either month and year');
  });

  it('should return 200 with monthly summary', async () => {
    Expense.find.mockResolvedValue(mockExpenses);
    Order.find.mockResolvedValue([mockOrder]);

    const res = await request(app)
      .get('/api/reports/summary?month=4&year=2026')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.period).toBe('April 2026');
    expect(res.body.totalExpenses).toBe(430.5);
    expect(res.body.totalIncome).toBe(1550);
    expect(res.body.profit).toBe(1119.5);
    expect(res.body.orderCount).toBe(1);
  });

  it('should return 200 with custom date range summary', async () => {
    Expense.find.mockResolvedValue(mockExpenses);
    Order.find.mockResolvedValue([mockOrder]);

    const res = await request(app)
      .get('/api/reports/summary?startDate=2026-04-01&endDate=2026-04-30')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.period).toBe('2026-04-01 to 2026-04-30');
    expect(res.body.totalExpenses).toBe(430.5);
    expect(res.body.totalIncome).toBe(1550);
  });
});
