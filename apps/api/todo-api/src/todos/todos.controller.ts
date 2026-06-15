import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TodosService, CreateTodoDto, UpdateTodoDto } from './todos.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.todosService.findAll(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.todosService.findOne(id, req.user.sub);
  }

  @Post()
  create(@Body() dto: CreateTodoDto, @Request() req: any) {
    return this.todosService.create({ ...dto, userId: req.user.sub });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(id, req.user.sub, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.todosService.remove(id, req.user.sub);
  }

  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Request() req: any, @Body('done') done: boolean) {
    return this.todosService.toggleDone(id, req.user.sub, done);
  }

  @Post(':id/subtasks')
  createSubtask(@Param('id') id: string, @Body('title') title: string) {
    return this.todosService.createSubtask(id, title);
  }

  @Patch('subtasks/:id/toggle')
  toggleSubtask(@Param('id') id: string, @Body('done') done: boolean) {
    return this.todosService.toggleSubtask(id, done);
  }

  @Delete('subtasks/:id')
  deleteSubtask(@Param('id') id: string) {
    return this.todosService.deleteSubtask(id);
  }
}

