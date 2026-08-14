import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  CurrentUser,
  type AuthUser,
} from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateManagedUserDto } from './dto/create-managed-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpgradeUserDto } from './dto/upgrade-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiUnauthorizedResponse()
@ApiForbiddenResponse()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin)' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  @ApiQuery({ name: 'q', required: false, description: 'Search name or email' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  list(
    @Query('role') role?: UserRole,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.usersService.list({
      role,
      q,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post()
  @ApiOperation({
    summary: 'Create an admin or judge account (admin)',
    description:
      'Creates a new user with role ADMIN or JUDGE. Public register still always creates CREATOR.',
  })
  @ApiCreatedResponse({ type: UserResponseDto })
  create(@Body() dto: CreateManagedUserDto): Promise<UserResponseDto> {
    return this.usersService.createManaged(dto);
  }

  @Post('upgrade')
  @ApiOperation({
    summary: 'Upgrade an existing user to JUDGE or ADMIN by email',
  })
  @ApiOkResponse({ type: UserResponseDto })
  upgrade(@Body() dto: UpgradeUserDto): Promise<UserResponseDto> {
    return this.usersService.upgradeByEmail(dto);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user role by id (admin)' })
  @ApiOkResponse({ type: UserResponseDto })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() actor: AuthUser,
  ): Promise<UserResponseDto> {
    return this.usersService.updateRole(id, dto, actor.id);
  }
}
