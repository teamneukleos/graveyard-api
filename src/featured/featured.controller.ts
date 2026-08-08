import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateFeaturedDto } from './dto/create-featured.dto';
import { FeaturedItemResponseDto } from './dto/featured-response.dto';
import { UpdateFeaturedDto } from './dto/update-featured.dto';
import { FeaturedService } from './featured.service';

@ApiTags('featured')
@Controller('featured')
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  @Get()
  @ApiOperation({
    summary: 'List currently featured submissions',
    description:
      'Public spotlights that are active and within their start/end window.',
  })
  @ApiOkResponse({ type: FeaturedItemResponseDto, isArray: true })
  findPublic(): Promise<FeaturedItemResponseDto[]> {
    return this.featuredService.findPublic();
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all featured items (admin)' })
  @ApiOkResponse({ type: FeaturedItemResponseDto, isArray: true })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  findAllAdmin(): Promise<FeaturedItemResponseDto[]> {
    return this.featuredService.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Feature a published submission (admin)' })
  @ApiCreatedResponse({ type: FeaturedItemResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  create(@Body() dto: CreateFeaturedDto): Promise<FeaturedItemResponseDto> {
    return this.featuredService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a featured item (admin)' })
  @ApiOkResponse({ type: FeaturedItemResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFeaturedDto,
  ): Promise<FeaturedItemResponseDto> {
    return this.featuredService.update(id, dto);
  }

  @Post(':id/deactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate a featured item (admin)' })
  @ApiOkResponse({ type: FeaturedItemResponseDto })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  deactivate(@Param('id') id: string): Promise<FeaturedItemResponseDto> {
    return this.featuredService.deactivate(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Permanently delete a featured item (admin)' })
  @ApiOkResponse({
    schema: { properties: { message: { type: 'string' } } },
  })
  @ApiUnauthorizedResponse()
  @ApiForbiddenResponse()
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.featuredService.remove(id);
  }
}
