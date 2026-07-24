import { Module } from '@nestjs/common';
<<<<<<<< HEAD:src/cloudflareR2/cloudflare.module.ts
import { CloudinaryService } from './cloudflare.service';
========
import { CloudinaryService } from './cloudflareR2.service';
>>>>>>>> main:src/cloudflareR2/cloudflareR2.module.ts

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService],
})
export class CloudinaryModule {}
