import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Category } from '@prisma/client';
import { slugify } from '../common/utils/string.util';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryResponseDto } from './dto/category-response.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map((category) => this.toPublic(category));
  }

  async findAllAdmin(): Promise<CategoryResponseDto[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
    return categories.map((category) => this.toAdmin(category));
  }

  async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const name = dto.name.trim();
    const slug = await this.buildUniqueSlug(name);
    const maxSort = await this.prisma.category.aggregate({
      _max: { sortOrder: true },
    });

    try {
      const category = await this.prisma.category.create({
        data: {
          name,
          slug,
          description: dto.description?.trim() || null,
          sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
          isActive: true,
        },
      });
      return this.toAdmin(category);
    } catch {
      throw new ConflictException('Category name or slug already exists');
    }
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto[]> {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Category not found');
    }

    if (dto.direction) {
      await this.reorder(existing, dto.direction);
      return this.findAllAdmin();
    }

    const data: {
      name?: string;
      slug?: string;
      description?: string | null;
      isActive?: boolean;
    } = {};

    if (dto.name !== undefined) {
      const name = dto.name.trim();
      data.name = name;
      if (name !== existing.name) {
        data.slug = await this.buildUniqueSlug(name, existing.id);
      }
    }
    if (dto.description !== undefined) {
      const description = dto.description.trim();
      data.description = description.length ? description : null;
    }
    if (dto.isActive !== undefined) {
      data.isActive = dto.isActive;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No category changes provided');
    }

    try {
      await this.prisma.category.update({ where: { id }, data });
    } catch {
      throw new ConflictException('Category name or slug already exists');
    }

    return this.findAllAdmin();
  }

  private async reorder(category: Category, direction: 'up' | 'down') {
    const neighbor = await this.prisma.category.findFirst({
      where:
        direction === 'up'
          ? { sortOrder: { lt: category.sortOrder } }
          : { sortOrder: { gt: category.sortOrder } },
      orderBy:
        direction === 'up' ? { sortOrder: 'desc' } : { sortOrder: 'asc' },
    });

    if (!neighbor) {
      return;
    }

    await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id: category.id },
        data: { sortOrder: neighbor.sortOrder },
      }),
      this.prisma.category.update({
        where: { id: neighbor.id },
        data: { sortOrder: category.sortOrder },
      }),
    ]);
  }

  private async buildUniqueSlug(name: string, excludeId?: string) {
    const base = slugify(name) || 'category';
    let candidate = base;
    let n = 2;
    while (true) {
      const existing = await this.prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${base}-${n}`;
      n += 1;
    }
  }

  private toPublic(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      sortOrder: category.sortOrder,
    };
  }

  private toAdmin(category: Category): CategoryResponseDto {
    return {
      ...this.toPublic(category),
      isActive: category.isActive,
    };
  }
}
