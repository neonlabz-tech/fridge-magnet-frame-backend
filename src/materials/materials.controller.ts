import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { MaterialsService } from './materials.service';
import { SaveMaterialsDto } from './dto/material.dto';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Get()
  findAll() {
    return this.materialsService.findAll();
  }

  @Get(':productKey')
  findOne(@Param('productKey') productKey: string) {
    return this.materialsService.findOne(productKey);
  }

  @Put(':productKey')
  save(@Param('productKey') productKey: string, @Body() dto: SaveMaterialsDto) {
    return this.materialsService.save(productKey, dto);
  }

  @Delete(':productKey')
  remove(@Param('productKey') productKey: string) {
    return this.materialsService.remove(productKey);
  }
}
