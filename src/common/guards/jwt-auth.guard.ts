import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      if (info && info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }
      if (info && info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      }
      if (info && info.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token not active');
      }
      throw new UnauthorizedException('Authentication required');
    }
    return user;
  }
}
