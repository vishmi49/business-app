const request = require('supertest');
const app = require('../app');
const Client = require('../models/client.model');
const Order = require('../models/order.model');
const Admin = require('../models/admin.model');
const jwt = require('jsonwebtoken');

// ── Mocks ────────────────────────────────────────────────────────────────────
jest.mock('../models/client.model');
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
const mockClient = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Sarah Johnson',
  companyName: 'Johnson Apparel',
  contactNumber: '0771234567',
  email: 'sarah@johnsonapparel.com',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ── POST /api/clients ────────────────────────────────────────────────────────
describe('POST /api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Cookie', 'token=mocktoken')
      .send({ name: 'Sarah Johnson' });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe(
      'Name, company name, contact number and email are required'
    );
  });

  it('should return 201 and create client with valid data', async () => {
    Client.create.mockResolvedValue(mockClient);

    const res = await request(app)
      .post('/api/clients')
      .set('Cookie', 'token=mocktoken')
      .send({
        name: 'Sarah Johnson',
        companyName: 'Johnson Apparel',
        contactNumber: '0771234567',
        email: 'sarah@johnsonapparel.com',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Client created successfully');
    expect(res.body.client.email).toBe('sarah@johnsonapparel.com');
  });

  it('should return 400 on duplicate email', async () => {
    Client.create.mockRejectedValue({
      code: 11000,
      keyValue: { email: 'sarah@johnsonapparel.com' },
    });

    const res = await request(app)
      .post('/api/clients')
      .set('Cookie', 'token=mocktoken')
      .send({
        name: 'Sarah Johnson',
        companyName: 'Johnson Apparel',
        contactNumber: '0771234567',
        email: 'sarah@johnsonapparel.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('email already exists');
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app)
      .post('/api/clients')
      .send({ name: 'Sarah Johnson' });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/clients ─────────────────────────────────────────────────────────
describe('GET /api/clients', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 200 and list of clients', async () => {
    Client.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockClient]),
    });

    const res = await request(app)
      .get('/api/clients')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.clients).toHaveLength(1);
  });

  it('should return 401 if no token provided', async () => {
    const res = await request(app).get('/api/clients');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/clients/:id ─────────────────────────────────────────────────────
describe('GET /api/clients/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if client not found', async () => {
    Client.findById.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/clients/507f1f77bcf86cd799439011')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Client not found');
  });

  it('should return 200 with client and orders', async () => {
    Client.findById.mockResolvedValue(mockClient);
    Order.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .get('/api/clients/507f1f77bcf86cd799439011')
      .set('Cookie', 'token=mocktoken');

    expect(res.status).toBe(200);
    expect(res.body.client).toBeDefined();
    expect(res.body.orders).toBeDefined();
  });
});

// ── PUT /api/clients/:id ─────────────────────────────────────────────────────
describe('PUT /api/clients/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth();
  });

  it('should return 404 if client not found', async () => {
    Client.findByIdAndUpdate.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/clients/507f1f77bcf86cd799439011')
      .set('Cookie', 'token=mocktoken')
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Client not found');
  });

  it('should return 200 and updated client', async () => {
    const updatedClient = { ...mockClient, companyName: 'Johnson Apparel Ltd' };
    Client.findByIdAndUpdate.mockResolvedValue(updatedClient);

    const res = await request(app)
      .put('/api/clients/507f1f77bcf86cd799439011')
      .set('Cookie', 'token=mocktoken')
      .send({ companyName: 'Johnson Apparel Ltd' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Client updated successfully');
    expect(res.body.client.companyName).toBe('Johnson Apparel Ltd');
  });
});
