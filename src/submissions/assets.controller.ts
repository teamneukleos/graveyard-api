import {
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AssetsService } from './assets.service';
import { AddAssetLinkDto } from './dto/add-asset-link.dto';
import { SubmissionAssetResponseDto } from './dto/submission-response.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('assets')
@Controller('submissions/:id/assets')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload an image, video, or PDF to a draft submission',
    description:
      'Stores the file via STORAGE_DRIVER (local disk or Cloudflare R2) and saves the public URL on the asset.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: { type: 'string', format: 'binary' },
        isCover: { type: 'boolean' },
        sortOrder: { type: 'integer' },
      },
    },
  })
  @ApiCreatedResponse({ type: SubmissionAssetResponseDto })
  @ApiUnauthorizedResponse()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('isCover') isCover?: string,
    @Body('sortOrder') sortOrder?: string,
  ): Promise<SubmissionAssetResponseDto> {
    return this.assetsService.uploadFile(user.id, id, file, {
      isCover:
        isCover === undefined
          ? undefined
          : isCover === 'true' || isCover === '1',
      sortOrder:
        sortOrder === undefined || sortOrder === ''
          ? undefined
          : Number(sortOrder),
    });
  }

  @Post('link')
  @ApiOperation({
    summary: 'Attach an external link (deck, Figma, Vimeo, Behance, etc.)',
  })
  @ApiCreatedResponse({ type: SubmissionAssetResponseDto })
  @ApiUnauthorizedResponse()
  addLink(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddAssetLinkDto,
  ): Promise<SubmissionAssetResponseDto> {
    return this.assetsService.addLink(user.id, id, dto);
  }

  @Patch(':assetId')
  @ApiOperation({ summary: 'Update asset cover/sort on a draft' })
  @ApiOkResponse({ type: SubmissionAssetResponseDto })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateAssetDto,
  ): Promise<SubmissionAssetResponseDto> {
    return this.assetsService.update(user.id, id, assetId, dto);
  }

  @Delete(':assetId')
  @ApiOperation({ summary: 'Remove an asset from a draft' })
  @ApiOkResponse({
    schema: { properties: { message: { type: 'string' } } },
  })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('assetId') assetId: string,
  ): Promise<{ message: string }> {
    return this.assetsService.remove(user.id, id, assetId);
  }
}
