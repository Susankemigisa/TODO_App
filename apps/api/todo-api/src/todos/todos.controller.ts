import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TodosService, CreateTodoDto, UpdateTodoDto } from './todos.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@ApiTags('todos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @ApiOperation({ summary: 'Get all todos for logged in user' })
  @Get()
  findAll(@Request() req: any) {
    return this.todosService.findAll(req.user.sub);
  }

  @ApiOperation({ summary: 'Get a single todo' })
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.todosService.findOne(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Create a new todo' })
  @Post()
  create(@Body() dto: CreateTodoDto, @Request() req: any) {
    return this.todosService.create({ ...dto, userId: req.user.sub });
  }

  @ApiOperation({ summary: 'Update a todo' })
  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateTodoDto) {
    return this.todosService.update(id, req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Delete a todo' })
  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.todosService.remove(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Toggle a todo done/undone' })
  @Patch(':id/toggle')
  toggle(@Param('id') id: string, @Request() req: any, @Body('done') done: boolean) {
    return this.todosService.toggleDone(id, req.user.sub, done);
  }

  @ApiOperation({ summary: 'Add a subtask to a todo' })
  @Post(':id/subtasks')
  createSubtask(@Param('id') id: string, @Body('title') title: string) {
    return this.todosService.createSubtask(id, title);
  }

  @ApiOperation({ summary: 'Toggle a subtask done/undone' })
  @Patch('subtasks/:id/toggle')
  toggleSubtask(@Param('id') id: string, @Body('done') done: boolean) {
    return this.todosService.toggleSubtask(id, done);
  }

  @ApiOperation({ summary: 'Delete a subtask' })
  @Delete('subtasks/:id')
  deleteSubtask(@Param('id') id: string) {
    return this.todosService.deleteSubtask(id);
  }
}