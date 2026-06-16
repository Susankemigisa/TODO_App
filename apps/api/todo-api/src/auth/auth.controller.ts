import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.validateToken(req.user);
  }

  @Post('google')
  googleAuth(@Body() body: {
    email: string;
    name: string;
    avatar: string;
    googleId: string;
  }) {
    return this.authService.googleAuth(body);
  }

  @Post('signup')
  signup(@Body() body: { name: string; email: string; password: string }) {
    return this.authService.signup(body.name, body.email, body.password);
  }
}