import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { CustomerService } from '../customer/customer.service';
import { MailService } from './mail.service';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockCustomerService = {
    ensureForRegisteredUser: jest.fn().mockResolvedValue({}),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: CustomerService,
          useValue: mockCustomerService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register user', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.create.mockResolvedValue({
      _id: '1',
      email: 'test@test.com',
      role: 'user',
    });

    const result = await service.register({
      email: 'test@test.com',
      password: '123456',
    } as any);

    expect(result).toHaveProperty('access_token');
    expect(result.user.email).toBe('test@test.com');
  });
});