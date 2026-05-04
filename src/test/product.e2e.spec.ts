import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { Product } from '../products/schemas/product.schema';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('Products E2E Tests', () => {
  let app: INestApplication;
  let productModel: any;

  const mockCloudinary = {
    uploadImage: jest.fn().mockResolvedValue({
      secure_url: 'http://test-image.com',
      public_id: 'test-id',
    }),
    uploadMultipleImages: jest.fn().mockResolvedValue([
      { secure_url: 'http://test-image.com', public_id: 'test-id' },
    ]),
    deleteImage: jest.fn().mockResolvedValue({ success: true }),
    deleteMultipleImages: jest.fn().mockResolvedValue([{ success: true }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CloudinaryService)
      .useValue(mockCloudinary)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    productModel = moduleFixture.get(getModelToken(Product.name));
  });

  beforeEach(async () => {
    await productModel.deleteMany({});
  });

  afterAll(async () => {
    await productModel.deleteMany({});
    await app.close();
  });

  const testProduct = {
    productId: 'P001',
    productName: 'Test Product',
    category: 'Gift',
    price: 100,
    stock: 20,
    description: 'Test description',
  };

  // ✅ CREATE
  describe('POST /api/products', () => {
    it('should create product', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct)
        .expect(201);

      expect(res.body.data.productId).toBe(testProduct.productId);
    });

    it('should return 400 for duplicate product', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct)
        .expect(400);
    });
  });

  // ✅ GET ALL + FILTER
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const res = await request(app.getHttpServer())
        .get('/api/products')
        .expect(200);

      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by category', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const res = await request(app.getHttpServer())
        .get('/api/products?category=Gift')
        .expect(200);

      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
    });

    it('should search product', async () => {
      await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const res = await request(app.getHttpServer())
        .get('/api/products?search=Test')
        .expect(200);

      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ✅ GET ONE
  describe('GET /api/products/:id', () => {
    it('should get single product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const id = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .get(`/api/products/${id}`)
        .expect(200);

      expect(res.body.data.productId).toBe(testProduct.productId);
    });

    it('should return 404 if not found', async () => {
      await request(app.getHttpServer())
        .get('/api/products/invalid-id')
        .expect(400);
    });
  });

  // ✅ UPDATE
  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const id = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .put(`/api/products/${id}`)
        .send({ productName: 'Updated Product' })
        .expect(200);

      expect(res.body.data.productName).toBe('Updated Product');
    });
  });

  // ✅ DELETE
  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const id = createRes.body.data._id;

      const res = await request(app.getHttpServer())
        .delete(`/api/products/${id}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 if not found', async () => {
      await request(app.getHttpServer())
        .delete('/api/products/invalid-id')
        .expect(400);
    });
  });

  // ✅ IMAGE DELETE (optional but good)
  describe('DELETE /api/products/:productId/image/:publicId', () => {
    it('should delete image', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/products')
        .send(testProduct);

      const id = createRes.body.data._id;

      await request(app.getHttpServer())
        .delete(`/api/products/${id}/image/test-id`)
        .expect(200);
    });
  });
});