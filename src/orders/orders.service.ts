import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ReceiptTemplate, ReceiptData } from './templates/receipt.template';
import * as puppeteer from 'puppeteer';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly statusRank: Record<string, number> = {
    PENDING: 0,
    PROCESSING: 1,
    SHIPPED: 2,
    DELIVERED: 3,
    CANCELED: 4,
  };

  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  private getStatusFromStock(stock: number) {
    if (stock > 10) return 'In Stock';
    if (stock > 0) return 'Low Stock';
    return 'Out of Stock';
  }

  async create(dto: CreateOrderDto) {
    if (dto.items?.length) {
      for (const item of dto.items) {
        if (!item.productId) continue;

        const quantity = Math.max(Number(item.quantity || 0), 0);
        if (quantity === 0) continue;

        const product = Types.ObjectId.isValid(item.productId)
          ? await this.productModel.findById(item.productId)
          : await this.productModel.findOne({ productId: item.productId });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        if (Number(product.stock || 0) < quantity) {
          throw new BadRequestException(
            `${product.productName} stock not available`,
          );
        }

        product.stock = Number(product.stock || 0) - quantity;
        product.status = this.getStatusFromStock(product.stock);
        product.updatedAt = new Date();

        await product.save();
      }
    }

    const order = await this.orderModel.create(dto);
    await this.usersService.updateFromOrder({
      email: dto.email,
      customerName: dto.customerName,
      phone: dto.phone,
      shippingAddress: dto.shippingAddress,
    });
    return order;
  }

  findAll(status?: string, search?: string) {
    const filter: any = {};

    if (status && status !== 'ALL') {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { district: { $regex: search, $options: 'i' } },
      ];
    }

    return this.orderModel.find(filter).sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByOrderId(orderId: string) {
    const order = await this.orderModel.findOne({ orderId: orderId });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const currentRank = this.statusRank[order.status];
    const nextRank = this.statusRank[dto.status];

    if (nextRank < currentRank) {
      throw new BadRequestException(
        `Order status cannot move back from ${order.status} to ${dto.status}`,
      );
    }

    order.status = dto.status;
    order.adminNote = dto.adminNote;
    await order.save();

    if (!dto.sendEmailNotification) {
      return order;
    }

    if (!order.email) {
      this.logger.warn(
        `[Orders] sendEmailNotification=true but order ${order.orderId} has no email address`,
      );
      return {
        ...order.toObject(),
        emailNotification: { attempted: false, success: false, error: 'Order has no email address' },
      };
    }

    const emailResult = await this.mailService.sendOrderStatusUpdate({
      to: order.email,
      customerName: order.customerName,
      orderId: order.orderId,
      newStatus: dto.status,
      adminNote: dto.adminNote,
    });

    return {
      ...order.toObject(),
      emailNotification: {
        attempted: true,
        success: emailResult.success,
        ...(emailResult.error ? { error: emailResult.error } : {}),
      },
    };
  }

  async delete(id: string) {
    const order = await this.orderModel.findByIdAndDelete(id);
    if (!order) throw new NotFoundException('Order not found');

    return {
      message: 'Order deleted successfully',
    };
  }

  async generateReceipt(orderNumber: string): Promise<Buffer> {
    const order = await this.orderModel.findOne({ orderId: orderNumber });
    if (!order) throw new NotFoundException('Order not found');

    const orderObj = order.toObject();
    
    // Calculate items subtotal from actual item data
    let itemsSubtotal = 0;
    
    if (orderObj.items && orderObj.items.length > 0) {
      // Sum up each item's price × quantity from the stored order items
      itemsSubtotal = orderObj.items.reduce((sum, item) => {
        const itemPrice = Number(item.price || 0);
        const itemQuantity = Number(item.quantity || 1);
        return sum + (itemPrice * itemQuantity);
      }, 0);
    }
    
    // Derive delivery fee from the actual order total and items subtotal.
    // totalValue is what the customer was charged; subtracting items cost gives
    // the real delivery fee rather than assuming a hardcoded Rs 500.
    const subtotal = Math.max(0, itemsSubtotal);
    const deliveryFee = subtotal > 0
      ? Math.max(0, orderObj.totalValue - subtotal)
      : 0;  // fallback: no items data, treat full amount as subtotal with no fee
    
    // If we had no items data, fall back so the total still shows correctly
    const finalTotal = orderObj.totalValue;
    
    // Prepare receipt data
    const receiptData: ReceiptData = {
      orderId: orderObj.orderId,
      customerName: orderObj.customerName,
      email: orderObj.email,
      phone: orderObj.phone,
      shippingAddress: orderObj.shippingAddress,
      district: orderObj.district,
      status: orderObj.status,
      totalValue: finalTotal, // Use calculated total
      subtotal: subtotal,     // Items subtotal
      deliveryFee: deliveryFee,
      qty: orderObj.qty,
      items: orderObj.items,
      createdAt: (orderObj as any).createdAt || new Date(),
      adminNote: orderObj.adminNote,
    };

    // Try with main template first
    try {
      const html = ReceiptTemplate.generateReceipt(receiptData);
      const pdfBuffer = await this.generatePDFFromHTML(html);
      this.logger.log(`PDF receipt generated successfully for order: ${orderNumber}`);
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Primary PDF generation failed for order ${orderNumber}:`, error);
      
      // Try with simple fallback
      try {
        const simpleHTML = this.createSimplePDFContent(receiptData);
        const fallbackPDF = await this.generatePDFFromHTML(simpleHTML);
        this.logger.warn(`Simple PDF fallback used for order: ${orderNumber}`);
        return fallbackPDF;
      } catch (fallbackError) {
        this.logger.error(`All PDF generation failed for order ${orderNumber}:`, fallbackError);
        throw new Error('Unable to generate receipt PDF. Please contact support.');
      }
    }
  }

  private async generatePDFFromHTML(html: string): Promise<Buffer> {
    let browser: puppeteer.Browser | null = null;
    let page: puppeteer.Page | null = null;
    
    try {
      // Create fresh browser instance with minimal configuration
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--hide-scrollbars',
          '--mute-audio'
        ],
        timeout: 15000
      });
      
      page = await browser.newPage();
      
      // Set viewport
      await page.setViewport({ width: 800, height: 1200 });
      
      // Disable JavaScript for faster rendering
      await page.setJavaScriptEnabled(false);
      
      // Set content
      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12px',
          right: '12px',
          bottom: '12px',
          left: '12px'
        },
        scale: 0.85,
        timeout: 8000
      });
      
      return Buffer.from(pdfBuffer);
      
    } finally {
      // Clean up resources
      if (page) {
        try {
          await page.close();
        } catch (err) {
          // Ignore close errors
        }
      }
      
      if (browser) {
        try {
          await browser.close();
        } catch (err) {
          // Ignore close errors
          try {
            // Force kill if needed
            const process = browser.process();
            if (process && !process.killed) {
              process.kill('SIGKILL');
            }
          } catch (killErr) {
            // Ignore kill errors
          }
        }
      }
    }
  }

  private createSimplePDFContent(data: ReceiptData): string {
    // Ensure calculations are correct in simple template too
    const itemsSubtotal = data.subtotal || 0;
    const deliveryFee = data.deliveryFee || 0;
    const totalAmount = data.totalValue || (itemsSubtotal + deliveryFee);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.6; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .section { margin: 20px 0; }
          .label { font-weight: bold; display: inline-block; width: 140px; }
          .total { font-size: 16px; font-weight: bold; margin-top: 20px; padding-top: 10px; border-top: 2px solid #333; }
          .company { color: #666; font-size: 12px; text-align: center; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MAGNIFY</h1>
          <h2>Customer Receipt</h2>
          <p>Order: ${data.orderId}</p>
        </div>
        
        <div class="section">
          <div><span class="label">Customer:</span> ${data.customerName}</div>
          <div><span class="label">Email:</span> ${data.email}</div>
          ${data.phone ? `<div><span class="label">Phone:</span> ${data.phone}</div>` : ''}
          <div><span class="label">Date:</span> ${new Date(data.createdAt).toLocaleDateString()}</div>
          <div><span class="label">Status:</span> ${data.status}</div>
        </div>
        
        ${data.shippingAddress ? `
        <div class="section">
          <div><span class="label">Delivery:</span> ${data.shippingAddress}</div>
          ${data.district ? `<div><span class="label">District:</span> ${data.district}</div>` : ''}
        </div>
        ` : ''}
        
        <div class="section">
          <div><span class="label">Items:</span> ${data.qty} × Custom Magnet Frame</div>
          <div><span class="label">Subtotal:</span> Rs ${itemsSubtotal.toLocaleString()}</div>
          ${deliveryFee > 0 ? `<div><span class="label">Delivery Fee:</span> Rs ${deliveryFee.toLocaleString()}</div>` : ''}
        </div>
        
        <div class="total">
          <div><span class="label">Total Amount:</span> Rs ${totalAmount.toLocaleString()}</div>
        </div>
        
        <div class="company">
          <p>Thank you for choosing MAGNIFY!</p>
          <p>Contact: magnifyofficials@gmail.com | +94 75 391 2534</p>
        </div>
      </body>
      </html>
    `;
  }
}