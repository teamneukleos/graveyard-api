import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { AuthUser } from '../decorators/current-user.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';

function roleSatisfies(userRole: UserRole, required: UserRole): boolean {
  if (userRole === required) return true;

  // SUPER_ADMIN inherits ADMIN permissions
  if (required === UserRole.ADMIN && userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Admins inherit JUDGE permissions when a route asks for JUDGE
  if (
    required === UserRole.JUDGE &&
    (userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN)
  ) {
    return true;
  }

  return false;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (
      !user ||
      !requiredRoles.some((required) => roleSatisfies(user.role, required))
    ) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
