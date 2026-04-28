import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Check if user exists and has a role
    if (!user || !user.role) {
      throw new UnauthorizedException('User not authenticated or missing role');
    }
    
    // Check if user has required role
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(`Insufficient role. Required: ${requiredRoles.join(', ')}, User role: ${user.role}`);
    }
    
    return true;
  }
}
