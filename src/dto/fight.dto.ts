// src/dto/fight.dto.ts
import { IsString, IsDate, IsArray, IsNumber, IsBoolean, IsOptional, IsEnum, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFightDTO {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  location: string;

  @IsDate()
  @Type(() => Date)
  scheduledAt: Date;

  @IsUUID()
  fighterAId: string;

  @IsUUID()
  fighterBId: string;

  @IsNumber()
  @Min(1.0)
  @IsOptional()
  oddsA?: number;

  @IsNumber()
  @Min(1.0)
  @IsOptional()
  oddsB?: number;

  @IsUUID()
  @IsOptional()
  dayEventId?: string;
}

export class UpdateFightStatusDTO {
  @IsString()
  status: string;
}

export class ValidateFightResultDTO {
  @IsUUID()
  fightId: string;

  @IsString()
  winner: string;

  @IsString()
  @IsOptional()
  victoryMethod?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(15)
  round?: number;

  @IsString()
  @IsOptional()
  duration?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  password: string;

  @IsString()
  otpCode: string;
}

export class ListFightsDTO {
  @IsString()
  @IsOptional()
  status?: string;

  @IsUUID()
  @IsOptional()
  fighterId?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}

// ========== JOURNÉES DE LUTTE ==========

export class FightInDayEventDTO {
  @IsUUID()
  fighterAId: string;

  @IsUUID()
  fighterBId: string;

  @IsNumber()
  @Min(1)
  @Max(6)
  order: number;

  @IsString()
  @IsOptional()
  scheduledTime?: string;
}

export class CreateDayEventDTO {
  @IsString()
  title: string;

  @IsDate()
  @Type(() => Date)
  date: Date;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean = false;

  @IsArray()
  @Type(() => FightInDayEventDTO)
  @IsOptional()
  fights?: FightInDayEventDTO[];
}

export class UpdateDayEventDTO {
  @IsString()
  @IsOptional()
  title?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  date?: Date;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  bannerImage?: string;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsString()
  @IsOptional()
  status?: string;
}

export class ListDayEventsDTO {
  @IsString()
  @IsOptional()
  status?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  fromDate?: Date;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  toDate?: Date;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}