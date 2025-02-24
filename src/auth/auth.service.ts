import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { SignInDto } from './dto/signin.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingServiceProtocol } from './hash/hashing.service';
import jwtConfig from './config/jwt.config';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private readonly hashingSerevice: HashingServiceProtocol,

        @Inject(jwtConfig.KEY)
        private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
        private readonly jwtService: JwtService
    ) {}

    async authenticate(signInDto: SignInDto){

        const user = await this.prisma.user.findFirst({
            where: {
                email: signInDto.email
            }
        })

        if(!user) {
            throw new HttpException('Email não encontrado', HttpStatus.NOT_FOUND)
        }

        
        const passwordIsValid = await this.hashingSerevice.compare(signInDto.senha, user.hashSenha)

        if(!passwordIsValid){
            throw new HttpException('Senha incorreta', HttpStatus.UNAUTHORIZED)
        }

        const token = await this.jwtService.signAsync(
            {
                sub: user.id,
                email: user.email,
            },
            {
                secret: this.jwtConfiguration.secret,
                expiresIn: this.jwtConfiguration.jwtTtl,
            }
        )

        return {
            email: user.email,
            token: token 
        }
    }

}

