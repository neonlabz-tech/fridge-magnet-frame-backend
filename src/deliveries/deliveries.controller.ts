import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DeliveriesService } from './deliveries.service';
import {
  BulkDeliveryStatusDto,
  CreateDeliveryDto,
  UpdateDeliveryDto,
  UpdateDeliveryStatusDto,
} from './dto/delivery.dto';

@Controller('deliveries')
export class DeliveriesController {
  constructor(private readonly deliveriesService: DeliveriesService) {}

  @Get()
  findAll(
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('driver') driver?: string,
    @Query('search') search?: string,
  ) {
    return this.deliveriesService.findAll({ status, method, driver, search });
  }

  @Get('options')
  options() {
    return this.deliveriesService.options();
  }

  @Get('dispatch-orders')
  dispatchOrders() {
    return this.deliveriesService.dispatchOrders();
  }

  @Patch('bulk/status')
  bulkStatus(@Body() dto: BulkDeliveryStatusDto) {
    return this.deliveriesService.bulkUpdateStatus(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deliveriesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateDeliveryDto) {
    return this.deliveriesService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.deliveriesService.updateStatus(id, dto.status);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDeliveryDto) {
    return this.deliveriesService.update(id, dto);
  }

  @Put(':id')
  replace(@Param('id') id: string, @Body() dto: UpdateDeliveryDto) {
    return this.deliveriesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deliveriesService.remove(id);
  }
}
