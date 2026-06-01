import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepass123' })
  @IsString()
  password: string;
}
