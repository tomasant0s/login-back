import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { TokenPayload } from 'src/auth/decorators/token-payload.decorator';
import { PayloadTokenDto } from 'src/auth/dto/token-payload.dto';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Get()
    findAllUsers(
        @Query() paginationDto: PaginationDto,
        @TokenPayload() tokenPayload : PayloadTokenDto,
    ){
        return this.userService.findAll(paginationDto, tokenPayload)
    }

    @Get('/:id')
    findOneUser(@Param('id') id: string){
        return this.userService.findOne(id)
    }

    @Post()
    createUser(@Body() createUserDto: CreateUserDto){
        return this.userService.create(createUserDto)
    }

    @Patch()
    updateUser(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto){
        return this.userService.update(id, updateUserDto)
    }

    @Delete()
    deleteUser(@Param('id') id:string){
        return
    }
}


