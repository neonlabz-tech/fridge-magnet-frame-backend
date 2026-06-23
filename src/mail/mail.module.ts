<<<<<<< HEAD
import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Global()
=======
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

>>>>>>> 269f49c (fix(orders): send email notification on order status update (BUG-015))
@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
