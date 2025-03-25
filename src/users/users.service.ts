import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HashingServiceProtocol } from 'src/auth/hash/hashing.service';
import { PayloadTokenDto } from 'src/auth/dto/token-payload.dto';

@Injectable()
export class UsersService {
    constructor(
        private prisma: PrismaService,
        private readonly hashingService: HashingServiceProtocol
    ) { }

    async findAll(paginationDto: PaginationDto, tokenPayload: PayloadTokenDto) {
        const { limit = 10, offset = 0 } = paginationDto

        try {
            const usuarios = await this.prisma.user.findMany({
                take: limit,
                skip: offset,
                select: {
                    id: true,
                    email: true,
                    telefone: true,
                    tickets: true,
                    ticketsUsados: true,
                    altura: true,
                    peso: true,
                    imc: true,
                    prompt: true,
                    lastLogin: true,
                }
            })

            return usuarios
        } catch (err) {
            console.log(err)
            throw new HttpException('Falha ao buscar usuarios', HttpStatus.BAD_REQUEST)
        }
    }

    async findOne(id: string) {
        const user = await this.prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            email: true,
            telefone: true,
            tickets: true,
            ticketsUsados: true,
            altura: true,
            peso: true,
            imc: true,
            prompt: true,
            lastLogin: true,
            dieta: true,
            pagamentos: true,
          },
        });
      
        if (user) return user;
      
        throw new HttpException('Usuario nao encontrado', HttpStatus.NOT_FOUND);
      }
      

    async create(createUserDto: CreateUserDto) {
        try {
            const passwordHash = await this.hashingService.hash(createUserDto.senha)

            const user = await this.prisma.user.create({
                data: {
                    email: createUserDto.email,
                    telefone: createUserDto.telefone,
                    tickets: 0,
                    hashSenha: passwordHash,
                    nutricionistaPersonalizado: 0,
                },
                select: {
                    id: true,
                    email: true,
                    telefone: true,
                    tickets: true,
                }
            })

            return user

        } catch (err) {
            console.log(err)
            throw new HttpException('Falha ao cadastrar usuário', HttpStatus.BAD_REQUEST)
        }
    }

    async update(id: string, updateUserDto: UpdateUserDto) {
        try {
            const user = await this.prisma.user.findUnique({
                where: {
                    id: id,
                }
            })

            if (!user) {
                throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND)
            }


            const updateUser = await this.prisma.user.update({
                where: {
                    id: user.id,
                }, data: {
                    email: updateUserDto?.email ? updateUserDto?.email : user.email,
                    telefone: updateUserDto?.telefone ? updateUserDto?.telefone : user.telefone,
                    tickets: updateUserDto?.tickets ? updateUserDto?.tickets : user.tickets,
                    ticketsUsados: updateUserDto?.ticketsUsados ? updateUserDto?.ticketsUsados : user.ticketsUsados,
                    prompt: updateUserDto?.prompt ? updateUserDto?.prompt : user.prompt,
                    altura: updateUserDto?.altura ? updateUserDto?.altura : user.altura,
                    peso: updateUserDto?.peso ? updateUserDto?.peso : user.peso,
                    imc: updateUserDto?.imc ? updateUserDto?.imc : user.imc,
                    lastLogin: updateUserDto?.lastLogin ? updateUserDto?.lastLogin : user.lastLogin,
                },
                select: {
                    id: true,
                    email: true,
                    telefone: true,
                    tickets: true,
                    ticketsUsados: true,
                    altura: true,
                    peso: true,
                    imc: true,
                    prompt: true,
                    lastLogin: true,
                }
            })

            return updateUser
        } catch (err) {
            console.log(err)
            throw new HttpException('Falha ao atualizar usuário', HttpStatus.BAD_REQUEST)
        }
    }

    // async delete(id: string, deleteUserDto: DeleteUserDto) {
    //     try {
    //         const user = await this.prisma.usuario.findUnique({
    //             where: {
    //                 id: id,
    //             }
    //         })

    //         if (!user) {
    //             throw new HttpException('Usuário não encontrado', HttpStatus.NOT_FOUND)
    //         }

    //         const deletedUser = await this.prisma.usuario.update({
    //             where: {
    //                 id: user.id,
    //             }, data: {
    //                 deletado: deleteUserDto.deletado
    //             },
    //             select: {
    //                 id: true,
    //                 nome: true,
    //                 foto: true,
    //                 telefone: true,
    //                 email: true,
    //                 contratante_id: true,
    //                 deletado: true,
    //             }
    //         })

    //         return deletedUser
    //     } catch (err) {
    //         console.log(err)
    //         throw new HttpException('Falha ao atualizar usuário', HttpStatus.BAD_REQUEST)
    //     }
    // }
}
