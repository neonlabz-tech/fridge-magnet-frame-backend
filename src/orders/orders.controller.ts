import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';
import type { Response } from 'express';

@Controller('orders')
export class OrdersController {
  private readonly logger = new Logger(OrdersController.name);

  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ): Promise<any> {
    return this.ordersService.findAll(status, search);
  }

  /** Streams a customer photo as a file download (the browser cannot fetch the R2 URL directly because of CORS). */
  @Get('photos/download')
  async downloadPhoto(
    @Query('url') url: string,
    @Query('name') name: string,
    @Res() res: Response,
  ) {
    const photo = await this.ordersService.fetchCustomerPhoto(url);
    const safeName = String(name || 'photo').replace(/[^\w.\-]+/g, '_');
    res.set({
      'Content-Type': photo.contentType,
      'Content-Disposition': `attachment; filename="${safeName}"`,
      'Cache-Control': 'no-store',
    });
    res.send(photo.buffer);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<any> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }

  /** Removes the customer's uploaded photos from storage (delivered orders only). */
  @Delete(':id/customer-images')
  deleteCustomerImages(@Param('id') id: string) {
    return this.ordersService.deleteCustomerImages(id);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.ordersService.delete(id);
  }

  @Get(':orderNumber/receipt')
  async downloadReceipt(
    @Param('orderNumber') orderNumber: string,
    @Res() res: Response,
  ) {
    try {
      const receipt =
        await this.ordersService.generateReceipt(orderNumber);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="receipt-${orderNumber}.pdf"`,
      );
      res.setHeader(
        'Content-Length',
        receipt.length.toString(),
      );
      res.setHeader(
        'Cache-Control',
        'no-cache, no-store, must-revalidate',
      );
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Accept-Ranges', 'bytes');

      res.status(200);
      return res.send(receipt);
    } catch (error) {
      this.logger.error(
        `Failed to generate receipt for ${orderNumber}:`,
        error,
      );

      return res.status(500).json({
        error: 'Failed to generate receipt',
        message:
          'Unable to generate PDF receipt. Please try again.',
        orderNumber,
      });
    }
  }

  @Get(':orderNumber/receipt/status')
  async getReceiptStatus(
    @Param('orderNumber') orderNumber: string,
  ) {
    try {
      const order =
        await this.ordersService.findByOrderId(orderNumber);

      return {
        success: true,
        message: 'Receipt is ready for download',
        orderId: order.orderId,
        customerName: order.customerName,
        status: order.status,
        downloadUrl: `/orders/${orderNumber}/receipt`,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Order not found or receipt unavailable',
        error:
          error instanceof Error
            ? error.message
            : 'Unknown error',
      };
    }
  }
}