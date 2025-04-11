import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';
import { LoginUserDto, RegisterUserDto } from './dto';
import { RpcException } from '@nestjs/microservices';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { envs } from 'src/config/envs.config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('AuthService');

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log('Connected to Mongo database');
  }

  signJWT(payload: JwtPayload) {
    return this.jwtService.sign(payload);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async verifyToken(token: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payload = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unused-vars
      const { sub, iat, exp, ...user } = payload;
      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user,
        token: this.signJWT(user),
      };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: 'Token invalid',
      });
    }
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password } = registerUserDto;
    try {
      const user = await this.user.findUnique({
        where: { email },
      });
      if (user)
        throw new RpcException({
          status: 400,
          message: 'User already exists',
        });
      const newUser = await this.user.create({
        data: {
          email,
          name,
          password: bcrypt.hashSync(password, 10),
        },
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: __, ...rest } = newUser;
      return {
        user: rest,
        token: this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: error?.message,
      });
    }
  }

  async loginrUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;
    try {
      const user = await this.user.findUnique({
        where: { email },
      });
      if (!user)
        throw new RpcException({
          status: 400,
          message: 'User/Password no valid',
        });
      const isPasswordValid = bcrypt.compareSync(password, user.password);
      if (!isPasswordValid)
        throw new RpcException({
          status: 400,
          message: 'User/Password no valid',
        });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: __, ...rest } = user;
      return {
        user: rest,
        token: this.signJWT(rest),
      };
    } catch (error) {
      throw new RpcException({
        status: 400,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        message: error?.message,
      });
    }
  }
}
