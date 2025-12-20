import { Service } from 'typedi';
import { PrismaClient, User } from '@prisma/client';
import { sign, verify, JwtPayload } from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';
import { RegisterDTOType, LoginDTOType, VerifyOTPDTOType } from '../dto/auth.dto';

@Service()
export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterDTOType): Promise<{ user: User; tokens: any }> {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { phone: data.phone }] },
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
        wallet: {
          create: {},
        },
      },
      include: { wallet: true },
    });

    // Generate OTP
    await this.generateOTP(user.id, user.phone, 'PHONE_VERIFICATION');

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    return { user, tokens };
  }

  async login(data: LoginDTOType, ipAddress: string, userAgent: string): Promise<{ user: User; tokens: any }> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
      include: { wallet: true },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = this.generateTokens(user.id, user.email);

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: tokens.refreshToken,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    return { user, tokens };
  }

  async generateOTP(userId: string, phone: string, purpose: 'LOGIN' | 'RESET_PASSWORD' | 'PHONE_VERIFICATION'): Promise<string> {
    const code = Math.random().toString().slice(2, 8);
    
    await this.prisma.otpCode.create({
      data: {
        userId,
        code,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      },
    });

    // TODO: Send OTP via SMS to phone
    return code;
  }

  async verifyOTP(data: VerifyOTPDTOType): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: data.code,
        purpose: data.purpose,
        consumed: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otp) {
      throw new Error('Invalid or expired OTP');
    }

    // Mark OTP as consumed
    await this.prisma.otpCode.update({
      where: { id: otp.id },
      data: { consumed: true },
    });

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: data.purpose === 'PHONE_VERIFICATION',
        isActive: true,
      },
    });

    return updatedUser;
  }

  generateTokens(userId: string, email: string): { accessToken: string; refreshToken: string } {
    const accessToken = sign(
      { userId, email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );

    const refreshToken = sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret'
      ) as JwtPayload;

      const session = await this.prisma.session.findUnique({
        where: { refreshToken },
      });

      if (!session || session.status !== 'ACTIVE') {
        throw new Error('Invalid session');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return this.generateTokens(user.id, user.email);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.session.update({
      where: { refreshToken },
      data: { status: 'REVOKED' },
    });
  }
}
