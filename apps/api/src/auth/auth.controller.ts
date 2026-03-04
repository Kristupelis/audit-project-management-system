import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  } | null;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password, dto.name);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: AuthenticatedRequest) {
    return req.user ?? null;
  }

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  setup2fa(@CurrentUser('sub') userId: string) {
    return this.auth.generateTwoFactorSetup(userId);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  enable2fa(
    @CurrentUser('sub') userId: string,
    @Body() body: { secret: string; code: string },
  ) {
    return this.auth.enableTwoFactor(userId, body.secret, body.code);
  }

  @Post('2fa/verify-login')
  verifyLogin(@Body() body: { userId: string; code: string }) {
    return this.auth.verifyTwoFactorLogin(body.userId, body.code);
  }
}
