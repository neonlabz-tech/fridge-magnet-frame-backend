import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';

const mockOrderModel = {
  create: jest.fn(),
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  exec: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken('Order'),
          useValue: mockOrderModel,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create order', async () => {
    mockOrderModel.create.mockResolvedValue({ id: 1 });

    const result = await service.create({} as any);

    expect(mockOrderModel.create).toHaveBeenCalled();
  });

  it('should throw if order not found', async () => {
    mockOrderModel.findById.mockResolvedValue(null);

    await expect(service.findOne('123')).rejects.toThrow(
      NotFoundException,
    );
  });
});
