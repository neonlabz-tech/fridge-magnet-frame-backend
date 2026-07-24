import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudflare.service';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
