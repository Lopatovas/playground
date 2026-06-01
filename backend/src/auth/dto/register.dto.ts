import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepass123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  company?: string;
}
