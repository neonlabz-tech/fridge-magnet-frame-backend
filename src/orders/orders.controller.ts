import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, Logger } from '@nestjs/common';
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
  findAll(
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.ordersService.findAll(status, search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
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
      const receipt = await this.ordersService.generateReceipt(orderNumber);
      
      // Always treat as PDF - no HTML fallback to prevent popups
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="receipt-${orderNumber}.pdf"`);
      res.setHeader('Content-Length', receipt.length.toString());
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Accept-Ranges', 'bytes');
      
      // Send PDF directly
      res.status(200);
      return res.send(receipt);
      
    } catch (error) {
      this.logger.error(`Failed to generate receipt for ${orderNumber}:`, error);
      // Return error as JSON instead of HTML to prevent popup
      res.status(500).json({
        error: 'Failed to generate receipt',
        message: 'Unable to generate PDF receipt. Please try again.',
        orderNumber: orderNumber
      });
    }
  }

  @Get(':orderNumber/receipt/status')
  async getReceiptStatus(@Param('orderNumber') orderNumber: string) {
    try {
      // Find order by orderId field instead of _id
      const order = await this.ordersService.findByOrderId(orderNumber);
      
      return {
        success: true,
        message: 'Receipt is ready for download',
        orderId: order.orderId,
        customerName: order.customerName,
        status: order.status,
        downloadUrl: `/orders/${orderNumber}/receipt`
      };
    } catch (error) {
      return {
        success: false,
        message: 'Order not found or receipt unavailable',
        error: error.message
      };
    }
  }
}