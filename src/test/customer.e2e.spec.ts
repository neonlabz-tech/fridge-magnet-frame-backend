import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Customer } from '../customer/customer.schema';

describe('Customer E2E Tests', () => {
  let app: INestApplication;
  let customerModel: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    customerModel = moduleFixture.get(getModelToken(Customer.name));
  });

  beforeEach(async () => {
    await customerModel.deleteMany({});
  });

  afterAll(async () => {
    await customerModel.deleteMany({});
    await app.close();
  });

  const testCustomer = {
    customerName: 'John Doe',
    emailAddress: 'john@example.com',
    phoneNumber: '+94771234567',
    customerAddress: 'Colombo, Sri Lanka',
  };

  describe('POST /customers', () => {
    it('should create a customer successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer)
        .expect(201);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.emailAddress).toBe(testCustomer.emailAddress);
    });

    it('should return 400 for invalid email', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({
          ...testCustomer,
          emailAddress: 'invalid-email',
        })
        .expect(400);
    });

    it('should return 400 for invalid phone number', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send({
          ...testCustomer,
          phoneNumber: 'abc123',
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer)
        .expect(201);

      await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer)
        .expect(409);
    });
  });

  describe('GET /customers', () => {
    it('should return all customers with pagination', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer);

      const res = await request(app.getHttpServer())
        .get('/customers?page=1&limit=10')
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });
  });

  describe('GET /customers/:id', () => {
    it('should get a customer by id', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer);

      const id = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .get(`/customers/${id}`)
        .expect(200);

      expect(res.body.data.emailAddress).toBe(testCustomer.emailAddress);
    });

    it('should return 404 for invalid id', async () => {
      await request(app.getHttpServer())
        .get('/customers/invalid-id')
        .expect(404);
    });
  });

  describe('PATCH /customers/:id', () => {
    it('should update customer successfully', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer);

      const id = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .patch(`/customers/${id}`)
        .send({ customerName: 'Updated Name' })
        .expect(200);

      expect(res.body.data.customerName).toBe('Updated Name');
    });

    it('should return 409 for duplicate email on update', async () => {
      await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer);

      const second = await request(app.getHttpServer())
        .post('/customers')
        .send({
          ...testCustomer,
          emailAddress: 'second@example.com',
        });

      await request(app.getHttpServer())
        .patch(`/customers/${second.body.data._id}`)
        .send({ emailAddress: testCustomer.emailAddress })
        .expect(409);
    });
  });

  describe('DELETE /customers/:id', () => {
    it('should soft delete customer', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/customers')
        .send(testCustomer);

      const id = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .delete(`/customers/${id}`)
        .expect(200);

      expect(res.body.message).toBe('Customer deleted successfully');
    });
  });
});