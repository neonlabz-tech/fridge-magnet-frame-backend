import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

const mockOrdersService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
  delete: jest.fn(),
};

describe('OrdersController', () => {
  let controller: OrdersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: mockOrdersService,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call findAll with filters', async () => {
    mockOrdersService.findAll.mockResolvedValue([]);

    await controller.findAll('pending', 'John');

    expect(mockOrdersService.findAll).toHaveBeenCalledWith('pending', 'John');
  });

  it('should create order', async () => {
    mockOrdersService.create.mockResolvedValue({ id: 1 });

    const result = await controller.create({} as any);

    expect(mockOrdersService.create).toHaveBeenCalled();
  });
});
