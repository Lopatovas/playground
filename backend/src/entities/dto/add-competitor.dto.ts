import { IsString, IsOptional } from 'class-validator';

export class AddCompetitorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  domain?: string;
}
