import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Priority, Recurrence } from '@prisma/client';

export interface CreateTodoDto {
  title: string;
  notes?: string;
  priority?: Priority;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recurrence?: Recurrence;
  userId: string;
}

export interface UpdateTodoDto {
  title?: string;
  notes?: string;
  done?: boolean;
  priority?: Priority;
  dueDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recurrence?: Recurrence;
  order?: number;
}

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

  create(dto: CreateTodoDto) {
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
