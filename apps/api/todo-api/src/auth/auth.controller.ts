import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt.guard';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @ApiOperation({ summary: 'Sign up with email and password' })
  @Post('signup')
  signup(@Body() body: SignupDto) {
    return this.authService.signup(body.name, body.email, body.password);
  }

  @ApiOperation({ summary: 'Login or register with Google' })
  @Post('google')
  googleAuth(@Body() body: GoogleAuthDto) {
    return this.authService.googleAuth(body);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged in user' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Request() req: any) {
    return this.authService.validateToken(req.user);
  }
}
