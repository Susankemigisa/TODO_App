import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'Sue Kemigisa' })
  name: string;

  @ApiProperty({ example: 'sue@example.com' })
  email: string;

  @ApiProperty({ example: 'P@ssw0rd123' })
  password: string;
}
