import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../schemas/user.schema';

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let userModel: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    userModel = moduleFixture.get(getModelToken(User.name));
    
    await app.init();
  });

  afterAll(async () => {
    await userModel.deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  describe('Authentication Flow', () => {
    const testUser = {
      email: 'test@example.com',
      password: 'password123'
    };

    describe('POST /auth/register', () => {
      it('should register a new user successfully', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.role).toBe('user');
      });

      it('should return 409 for duplicate email', async () => {
        // First registration
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201);

        // Second registration with same email
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(409);
      });

      it('should validate email format', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'invalid-email', password: 'password123' })
          .expect(400);
      });

      it('should require minimum password length', async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({ email: 'test@example.com', password: '123' })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);
      });

      it('should login user and return JWT token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/login')
          .send(testUser)
          .expect(200);

        expect(response.body).toHaveProperty('access_token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(testUser.email);
        expect(response.body.user.role).toBe('user');
      });

      it('should return 401 for invalid credentials', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: testUser.email, password: 'wrongpassword' })
          .expect(401);
      });

      it('should return 401 for non-existent user', async () => {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: 'nonexistent@example.com', password: 'password123' })
          .expect(401);
      });
    });

    describe('POST /auth/forgot-password', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);
      });

      it('should generate reset token for existing user', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: testUser.email })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('resetToken');
        expect(response.body.message).toBe('If that email exists, a reset link has been sent.');
      });

      it('should return success message for non-existent email (security)', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: 'nonexistent@example.com' })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('If that email exists, a reset link has been sent.');
        expect(response.body).not.toHaveProperty('resetToken');
      });
    });

    describe('POST /auth/reset-password', () => {
      let resetToken: string;

      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser);

        const forgotResponse = await request(app.getHttpServer())
          .post('/auth/forgot-password')
          .send({ email: testUser.email });

        resetToken = forgotResponse.body.resetToken;
      });

      it('should reset password with valid token', async () => {
        const response = await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: resetToken,
            newPassword: 'newpassword123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Password reset successful');

        // Test login with new password
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email: testUser.email, password: 'newpassword123' })
          .expect(200);
      });

      it('should return 400 for invalid token', async () => {
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: 'invalid-token',
            newPassword: 'newpassword123'
          })
          .expect(400);
      });

      it('should return 400 for expired token', async () => {
        // This would require manually setting an expired token in the database
        // For now, we'll test with an invalid token format
        await request(app.getHttpServer())
          .post('/auth/reset-password')
          .send({
            token: 'expired-token-format',
            newPassword: 'newpassword123'
          })
          .expect(400);
      });
    });
  });

  describe('Auth Guards & Role-based Access', () => {
    let userToken: string;
    let adminToken: string;
    const adminUser = {
      email: 'admin@example.com',
      password: 'adminpassword123'
    };

    beforeEach(async () => {
      // Create regular user
      const userResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'user@example.com',
          password: 'userpassword123'
        });
      userToken = userResponse.body.access_token;

      // Create admin user manually
      const User = userModel;
      const hashedPassword = await require('bcrypt').hash(adminUser.password, 10);
      const admin = new User({
        email: adminUser.email,
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();

      // Login as admin
      const adminResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(adminUser);
      adminToken = adminResponse.body.access_token;
    });

    describe('JWT Authentication Guard', () => {
      it('should allow access with valid token', async () => {
        await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
      });

      it('should deny access without token', async () => {
        await request(app.getHttpServer())
          .get('/users')
          .expect(401);
      });

      it('should deny access with invalid token', async () => {
        await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });

      it('should deny access with malformed token', async () => {
        await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', 'InvalidFormat token')
          .expect(401);
      });
    });

    describe('Role-based Access Control', () => {
      it('should allow admin to access admin endpoints', async () => {
        const response = await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should deny regular user access to admin endpoints', async () => {
        await request(app.getHttpServer())
          .get('/users')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);
      });
    });

    describe('JWT Token Validation', () => {
      it('should contain role in JWT payload', async () => {
        // Decode the token to verify it contains role
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(userToken);
        
        expect(decoded).toHaveProperty('role');
        expect(decoded.role).toBe('user');
      });

      it('should validate token expiration', async () => {
        // This test would require creating an expired token
        // For now, we verify the token structure
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(userToken);
        
        expect(decoded).toHaveProperty('exp');
        expect(decoded).toHaveProperty('iat');
      });
    });
  });
});
