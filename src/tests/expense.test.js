const request = require('supertest');
const app = require('../app');
const Expense = require('../models/expense.model');
const Order = require('../models/order.model');
const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../models/expense.model');
jest.mock('../models/order.model');
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
  paidAmount: 0,
  paymentStatus: 'unpaid',
  save: jest.fn().mockResolvedValue(true),
};

const mockExpense = {
  _id: '507f1f77bcf86cd799439033',
  orderId: '507f1f77bcf86cd799439022',
  category: 'material',
  amount: 250.5,
  description: 'Cotton fabric purchase',
  date: new Date('2026-04-01'),
};

// ── POST /api/expenses ───────────────────────────────────────────────────────
describe('POST /api/expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', 'token=mocktoken')
      .send({ orderId: '507f1f77bcf86cd799439022', category: 'material' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Order, category, amount and date are required'
    );
  });

  it('should return 404 if order not found', async () => {
    Order.findById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', 'token=mocktoken')
      .send({
        orderId: '507f1f77bcf86cd799439022',
        category: 'material',
        amount: 250.5,
        date: '2026-04-01',
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('should return 201 and create expense', async () => {
    Order.findById.mockResolvedValue(mockOrder);
    Expense.create.mockResolvedValue(mockExpense);

    const res = await request(app)
      .post('/api/expenses')
      .set('Cookie', 'token=mocktoken')
      .send({
        orderId: '507f1f77bcf86cd799439022',
        category: 'material',
        amount: 250.5,
        date: '2026-04-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Expense created successfully');
    expect(res.body.expense.amount).toBe(250.5);
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .send({ orderId: '507f1f77bcf86cd799439022' });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/expenses ────────────────────────────────────────────────────────
describe('GET /api/expenses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 200 and list of expenses', async () => {
    Expense.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([mockExpense]),
    });

    const res = await request(app)
      .get('/api/expenses')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.expenses).toHaveLength(1);
  });

  it('should filter by category', async () => {
    Expense.find.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([mockExpense]),
    });

    const res = await request(app)
      .get('/api/expenses?category=material')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(Expense.find).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'material' })
    );
  });
});

// ── GET /api/expenses/order/:orderId ─────────────────────────────────────────
describe('GET /api/expenses/order/:orderId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if order not found', async () => {
    Order.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/expenses/order/507f1f77bcf86cd799439022')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Order not found');
  });

  it('should return 200 with expenses and total cost', async () => {
    Order.findById.mockResolvedValue(mockOrder);
    Expense.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockExpense]),
    });

    const res = await request(app)
      .get('/api/expenses/order/507f1f77bcf86cd799439022')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.totalCost).toBe(250.5);
    expect(res.body.expenses).toHaveLength(1);
  });
});

// ── PUT /api/expenses/:id ────────────────────────────────────────────────────
describe('PUT /api/expenses/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if expense not found', async () => {
    Expense.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/expenses/507f1f77bcf86cd799439033')
      .set('Cookie', 'token=mocktoken')
      .send({ amount: 300 });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Expense not found');
  });

  it('should return 200 and updated expense', async () => {
    const updatedExpense = { ...mockExpense, amount: 300 };
    Expense.findByIdAndUpdate.mockResolvedValue(updatedExpense);

    const res = await request(app)
      .put('/api/expenses/507f1f77bcf86cd799439033')
      .set('Cookie', 'token=mocktoken')
      .send({ amount: 300 });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Expense updated successfully');
    expect(res.body.expense.amount).toBe(300);
  });
});

// ── DELETE /api/expenses/:id ─────────────────────────────────────────────────
describe('DELETE /api/expenses/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if expense not found', async () => {
    Expense.findByIdAndDelete.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/expenses/507f1f77bcf86cd799439033')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Expense not found');
  });

  it('should return 200 and delete expense', async () => {
    Expense.findByIdAndDelete.mockResolvedValue(mockExpense);

    const res = await request(app)
      .delete('/api/expenses/507f1f77bcf86cd799439033')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Expense deleted successfully');
  });
});
