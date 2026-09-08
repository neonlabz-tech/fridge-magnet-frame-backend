import * as dotenv from 'dotenv';
dotenv.config();

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { MailModule } from '../src/mail/mail.module';
import { MailService } from '../src/mail/mail.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), MailModule],
})
class TestHarnessModule {}

async function main() {
  const to = process.argv[2];
  if (!to) {
    console.error('Usage: yarn ts-node -r tsconfig-paths/register test/manual-mail-test.ts <recipient-email>');
    process.exit(1);
  }

  const app = await NestFactory.createApplicationContext(TestHarnessModule);
  const mailService = app.get(MailService);

  const result = await mailService.sendOrderStatusUpdate({
    to,
    customerName: 'Test Customer',
    orderId: 'TEST-1234',
    newStatus: 'shipped',
    adminNote: 'This is a manual Resend delivery test.',
  });

  // console.log('sendOrderStatusUpdate result:', result);

  await app.close();
  process.exit(result.success ? 0 : 1);
}

main();
