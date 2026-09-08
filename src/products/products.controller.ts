import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private normalizePersonalization(input: unknown): { label: string }[] {
    if (Array.isArray(input)) {
      return input.map((item) =>
        typeof item === 'string' ? { label: item } : { label: (item as any)?.label ?? '' },
      );
    }

    if (typeof input === 'string') {
      const value = input.trim();
      if (!value) return [];

      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map((item) =>
            typeof item === 'string' ? { label: item } : { label: item?.label ?? '' },
          );
        }
      } catch {
        return value
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .map((label) => ({ label }));
      }

      return [{ label: value }];
    }

    if (input === undefined || input === null) {
      return [];
    }

    return [{ label: String(input) }];
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 5 },
        { name: 'personalizationImages', maxCount: 10 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles()
    files: {
      primaryImage?: Express.Multer.File[];
      galleryImages?: Express.Multer.File[];
      personalizationImages?: Express.Multer.File[];
    },
  ) {
    const trimmedDto: any = {};
    for (const key in createProductDto) {
      const trimmedKey = key.trim();
      trimmedDto[trimmedKey] = createProductDto[key];
    }

    const personalizationLabels = this.normalizePersonalization(
      trimmedDto.personalization,
    );

    const personalizationWithFiles = personalizationLabels.map((item, index) => ({
      label: item.label,
      imageFile: files?.personalizationImages?.[index] ?? null,
    }));

    const parsedDto: any = {
      ...trimmedDto,
      stock: trimmedDto.stock ? Number(trimmedDto.stock) : 0,
      price: trimmedDto.price ? Number(trimmedDto.price) : 0,
      imagecount: trimmedDto.imagecount ? Number(trimmedDto.imagecount) : 0,
      personalizationEnabled:
        trimmedDto.personalizationEnabled === true ||
        trimmedDto.personalizationEnabled === 'true',
    };
    delete parsedDto.personalization;

    return this.productsService.create(
      parsedDto,
      files?.primaryImage?.[0],
      files?.galleryImages,
      personalizationWithFiles,
    );
  }

  @Post(':id/gallery')
  @UseInterceptors(
    FilesInterceptor('galleryImages', 10, { storage: memoryStorage() }),
  )
  async addGalleryImages(
    @Param('id') id: string,
    @UploadedFiles() galleryImages: Express.Multer.File[],
  ) {
    const product = await this.productsService.findOne(id);
    const updateDto: UpdateProductDto = {};
    return this.productsService.update(id, updateDto, undefined, galleryImages);
  }

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const minPriceNum = minPrice ? parseFloat(minPrice) : undefined;
    const maxPriceNum = maxPrice ? parseFloat(maxPrice) : undefined;

    return this.productsService.findAll(
      pageNum,
      limitNum,
      search,
      category,
      status,
      minPriceNum,
      maxPriceNum,
    );
  }

  @Get(':id/stock-log')
  async getStockLog(@Param('id') id: string) {
    return this.productsService.getStockLog(id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'personalizationImages', maxCount: 10 },
      ],
      { storage: memoryStorage() },
    ),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      primaryImage?: Express.Multer.File[];
      personalizationImages?: Express.Multer.File[];
    },
  ) {
    const trimmedDto: any = {};
    for (const key in updateProductDto) {
      const trimmedKey = key.trim();
      trimmedDto[trimmedKey] = updateProductDto[key];
    }

    const parsedDto: any = { ...trimmedDto };

    if (trimmedDto.stock !== undefined) {
      parsedDto.stock = Number(trimmedDto.stock) || 0;
    }
    if (trimmedDto.price !== undefined) {
      parsedDto.price = Number(trimmedDto.price) || 0;
    }
    if (trimmedDto.imagecount !== undefined) {
      parsedDto.imagecount = Number(trimmedDto.imagecount) || 0;
    }
    if (trimmedDto.personalizationEnabled !== undefined) {
      parsedDto.personalizationEnabled =
        trimmedDto.personalizationEnabled === true ||
        trimmedDto.personalizationEnabled === 'true';
    }

    let personalizationWithFiles: { label: string; imageFile: Express.Multer.File | null }[] | undefined;

    if (trimmedDto.personalization !== undefined) {
      const personalizationLabels = this.normalizePersonalization(
        trimmedDto.personalization,
      );
      personalizationWithFiles = personalizationLabels.map((item, index) => ({
        label: item.label,
        imageFile: files?.personalizationImages?.[index] ?? null,
      }));
      delete parsedDto.personalization;
    }

    return this.productsService.update(
      id,
      parsedDto,
      files?.primaryImage?.[0],
      undefined,
      personalizationWithFiles,
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }

  @Delete(':productId/image/:publicId')
  async deleteImage(
    @Param('productId') productId: string,
    @Param('publicId') publicId: string,
  ) {
    return this.productsService.deleteImage(productId, publicId);
  }
}