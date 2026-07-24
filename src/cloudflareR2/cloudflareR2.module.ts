import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudflareR2.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
