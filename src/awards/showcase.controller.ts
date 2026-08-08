import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AwardsService } from './awards.service';
import { AwardResultItemDto } from './dto/result-response.dto';
import { ShowcaseQueryDto } from './dto/showcase-query.dto';

@ApiTags('showcase')
@Controller('showcase')
export class ShowcaseController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get()
  @ApiOperation({
    summary: 'Public awards showcase',
    description:
      'Browse shortlisted and winning work from published award cycles. Filter by year, category, placement, or cycle.',
  })
  @ApiOkResponse({ type: AwardResultItemDto, isArray: true })
  list(@Query() query: ShowcaseQueryDto): Promise<AwardResultItemDto[]> {
    return this.awardsService.showcase(query);
  }
}
