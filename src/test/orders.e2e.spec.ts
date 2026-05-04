import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../orders/schemas/order.schema';

describe('Orders E2E Tests', () => {
  let app: INestApplication;
  let orderModel: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    orderModel = moduleFixture.get(getModelToken(Order.name));
  });

  beforeEach(async () => {
    await orderModel.deleteMany({});
  });

  afterAll(async () => {
    await orderModel.deleteMany({});
    await app.close();
  });

  const testOrder = {
    orderId: 'ORD-001',
    customerName: 'John Doe',
    customerId: 'CUST-001',
    email: 'john@example.com',
    qty: 2,
    totalValue: 1000,
    shippingAddress: 'Colombo, Sri Lanka',
  };

  // 🔹 CREATE
  describe('POST /orders', () => {
    it('should create an order successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/orders')
        .send(testOrder)
        .expect(201);

      expect(res.body).toHaveProperty('_id');
      expect(res.body.customerName).toBe(testOrder.customerName);
    });
  });

  // 🔹 GET ALL
  describe('GET /orders', () => {
    it('should return all orders', async () => {
      await request(app.getHttpServer()).post('/orders').send(testOrder);

      const res = await request(app.getHttpServer()).get('/orders').expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter by status', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ ...testOrder, status: 'pending' });

      const res = await request(app.getHttpServer())
        .get('/orders?status=pending')
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should search orders', async () => {
      await request(app.getHttpServer()).post('/orders').send(testOrder);

      const res = await request(app.getHttpServer())
        .get('/orders?search=John')
        .expect(200);

      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 🔹 GET ONE
  describe('GET /orders/:id', () => {
    it('should get order by id', async () => {
      const create = await request(app.getHttpServer())
        .post('/orders')
        .send(testOrder);

      const id = create.body._id;

      const res = await request(app.getHttpServer())
        .get(`/orders/${id}`)
        .expect(200);

      expect(res.body._id).toBe(id);
    });

    it('should return 404 if order not found', async () => {
      await request(app.getHttpServer())
        .get('/orders/64b000000000000000000000')
        .expect(404);
    });
  });

  // 🔹 UPDATE STATUS
  describe('PATCH /orders/:id/status', () => {
    it('should update order status', async () => {
      const create = await request(app.getHttpServer())
        .post('/orders')
        .send(testOrder);

      const id = create.body._id;

      const res = await request(app.getHttpServer())
        .patch(`/orders/${id}/status`)
        .send({ status: 'completed', adminNote: 'Approved' })
        .expect(200);

      expect(res.body.status).toBe('completed');
      expect(res.body.adminNote).toBe('Approved');
    });

    it('should return 404 for invalid id', async () => {
      await request(app.getHttpServer())
        .patch('/orders/64b000000000000000000000/status')
        .send({ status: 'completed' })
        .expect(404);
    });
  });

  // 🔹 DELETE
  describe('DELETE /orders/:id', () => {
    it('should delete order', async () => {
      const create = await request(app.getHttpServer())
        .post('/orders')
        .send(testOrder);

      const id = create.body._id;

      const res = await request(app.getHttpServer())
        .delete(`/orders/${id}`)
        .expect(200);

      expect(res.body.message).toBe('Order deleted successfully');
    });

    it('should return 404 if order not found', async () => {
      await request(app.getHttpServer())
        .delete('/orders/64b000000000000000000000')
        .expect(404);
    });
  });
});
