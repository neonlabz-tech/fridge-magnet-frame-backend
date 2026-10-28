import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { ProductMaterials, ProductMaterialsSchema } from './schemas/material.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProductMaterials.name, schema: ProductMaterialsSchema }]),
  ],
  controllers: [MaterialsController],
  providers: [MaterialsService],
})
export class MaterialsModule {}
