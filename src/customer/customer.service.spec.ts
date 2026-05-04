import { Test, TestingModule } from '@nestjs/testing';
import { CustomerService } from './customer.service';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException } from '@nestjs/common';

const mockCustomerModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  countDocuments: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

describe('CustomerService', () => {
  let service: CustomerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getModelToken('Customer'),
          useValue: mockCustomerModel,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
  });

  it('should throw if duplicate email exists', async () => {
    mockCustomerModel.findOne.mockResolvedValue(true);

    await expect(
      service.create({ emailAddress: 'test@mail.com' } as any),
    ).rejects.toThrow(ConflictException);
  });
});
