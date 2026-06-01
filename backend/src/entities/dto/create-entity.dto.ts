import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateEntityDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
