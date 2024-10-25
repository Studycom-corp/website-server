import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, NotFoundException, Res } from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UpdateFileDto } from './dto/update-file.dto';
import { AuthGuard } from 'src/user/auth.guard';
import * as fs from 'node:fs'
import { Response } from 'express';

@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post()
  create(@Body() createFileDto: CreateFileDto) {
    return this.fileService.create(createFileDto);
  }

  @Get()
  findAll() {
    return this.fileService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fileService.findOne(+id);
  }

  @UseGuards(AuthGuard)
  @Get('/download/:filename')
  getOne(@Param() filename: string, @Body() fileKind: 'profile' | 'post' | 'document', @Res() response: Response){
    let filePath = `../../uploads/${fileKind}/${filename}`
    if(!fs.existsSync(filePath)){
      throw new NotFoundException(`File ${filename} doesn't exist`)
    }

    return response.sendFile(filePath)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFileDto: UpdateFileDto) {
    return this.fileService.update(+id, updateFileDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.fileService.remove(+id);
  }
}
