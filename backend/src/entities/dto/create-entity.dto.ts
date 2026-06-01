import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEntityDto {
  @ApiProperty({ example: 'Acme Corp', description: 'Company name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'acme.com', description: 'Company domain' })
  @IsOptional()
  @IsString()
  domain?: string;
}
