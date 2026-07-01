import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

export { CreateTodoDto } from './dto/create-todo.dto';
export { UpdateTodoDto } from './dto/update-todo.dto';

// userId is injected by the controller from the JWT — not sent by the client —
// so it's layered on here rather than living in the Swagger-visible DTO.
export type CreateTodoData = CreateTodoDto & { userId: string };

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.todo.findMany({
      where: { userId },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
    });
  }

  findOne(id: string, userId: string) {
    return this.prisma.todo.findFirst({
      where: { id, userId },
      include: {
        subtasks: { orderBy: { order: 'asc' } },
        tags: { include: { tag: true } },
      },
    });
  }

  create(dto: CreateTodoData) {
    return this.prisma.todo.create({
      data: {
        title: dto.title,
        notes: dto.notes,
        priority: dto.priority ?? 'MEDIUM',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        recurrence: dto.recurrence ?? 'NONE',
        userId: dto.userId,
      },
    });
  }

  update(id: string, userId: string, dto: UpdateTodoDto) {
    return this.prisma.todo.updateMany({
      where: { id, userId },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : dto.dueDate === null ? null : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : dto.startDate === null ? null : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : dto.endDate === null ? null : undefined,
      },
    });
  }

  remove(id: string, userId: string) {
    return this.prisma.todo.deleteMany({
      where: { id, userId },
    });
  }

  toggleDone(id: string, userId: string, done: boolean) {
    return this.prisma.todo.updateMany({
      where: { id, userId },
      data: { done },
    });
  }

  createSubtask(todoId: string, title: string) {
    return this.prisma.subtask.create({ data: { title, todoId } });
  }

  toggleSubtask(id: string, done: boolean) {
    return this.prisma.subtask.update({ where: { id }, data: { done } });
  }

  deleteSubtask(id: string) {
    return this.prisma.subtask.delete({ where: { id } });
  }
}
