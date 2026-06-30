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

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  private normalizePersonalization(
    input: unknown,
  ): { label: string; price: number; note: string; imageField: string | null }[] {
    const toEntry = (item: any): { label: string; price: number; note: string; imageField: string | null } => {
      if (item && typeof item === 'object') {
        const price = Number(item.price);
        return {
          label: String(item.label ?? '').trim(),
          price: Number.isFinite(price) ? price : 0,
          note: String(item.note ?? '').trim(),
          imageField: item.imageField ?? null,
        };
      }
      return { label: String(item).trim(), price: 0, note: '', imageField: null };
    };

    if (Array.isArray(input)) {
      return input.map(toEntry).filter((entry) => entry.label);
    }

    if (typeof input === 'string') {
      const value = input.trim();
      if (!value) return [];

      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          return parsed.map(toEntry).filter((entry) => entry.label);
        }
      } catch {
        // Not a JSON array string; treat as a single plain label
      }

      return [{ label: value, price: 0, note: '', imageField: null }];
    }

    if (input === undefined || input === null) {
      return [];
    }

    return [{ label: String(input).trim(), price: 0, note: '', imageField: null }].filter(
      (entry) => entry.label,
    );
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'primaryImage', maxCount: 1 },
        { name: 'galleryImages', maxCount: 5 },
        ...Array.from({ length: 10 }, (_, i) => ({
          name: `personalizationImage_${i}`,
          maxCount: 1,
        })),
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
      [key: string]: Express.Multer.File[] | undefined;
    },
  ) {
    // Trim keys and parse form-data fields
    const trimmedDto: any = {};
    for (const key in createProductDto) {
      const trimmedKey = key.trim();
      trimmedDto[trimmedKey] = createProductDto[key];
    }

    const parsedDto: any = {
      ...trimmedDto,
      stock: trimmedDto.stock ? Number(trimmedDto.stock) : 0,
      price: trimmedDto.price ? Number(trimmedDto.price) : 0,
      personalizationEnabled:
        trimmedDto.personalizationEnabled === true ||
        trimmedDto.personalizationEnabled === 'true',
      personalization: this.normalizePersonalization(
        trimmedDto.personalization,
      ),
    };

    // Collect each personalization option's image file (if any) keyed by its field name
    const personalizationImageFiles: Record<string, Express.Multer.File> = {};
    for (const key in files) {
      if (key.startsWith('personalizationImage_') && files[key]?.[0]) {
        personalizationImageFiles[key] = files[key]![0];
      }
    }

    return this.productsService.create(
      parsedDto,
      files?.primaryImage?.[0],
      files?.galleryImages,
      personalizationImageFiles,
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
    FileInterceptor('primaryImage', { storage: memoryStorage() }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() primaryImage?: Express.Multer.File,
  ) {
    return this.productsService.update(id, updateProductDto, primaryImage);
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
