import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
  @ApiProperty({ example: 'sue@example.com' })
  email: string;

  @ApiProperty({ example: 'Sue Kemigisa' })
  name: string;

  @ApiProperty({ example: 'https://lh3.googleusercontent.com/a/avatar.jpg' })
  avatar: string;

  @ApiProperty({ example: '108234567890123456789' })
  googleId: string;
}
