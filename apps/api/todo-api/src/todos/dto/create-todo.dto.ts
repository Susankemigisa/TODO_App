import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Priority, Recurrence } from '@prisma/client';

export class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries' })
  title: string;

  @ApiPropertyOptional({ example: 'Milk, eggs, bread' })
  notes?: string;

  @ApiPropertyOptional({ enum: Priority, example: 'MEDIUM' })
  priority?: Priority;

  @ApiPropertyOptional({ example: '2026-06-20T00:00:00.000Z', nullable: true })
  dueDate?: string | null;

  @ApiPropertyOptional({ example: '2026-06-18T00:00:00.000Z', nullable: true })
  startDate?: string | null;

  @ApiPropertyOptional({ example: '2026-06-19T00:00:00.000Z', nullable: true })
  endDate?: string | null;

  @ApiPropertyOptional({ enum: Recurrence, example: 'NONE' })
  recurrence?: Recurrence;
}
