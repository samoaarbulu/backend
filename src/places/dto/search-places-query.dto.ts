import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  toNumberOrUndefined,
  toTrimmedStringOrUndefined,
} from './place-transformers.js';

export class SearchPlacesQueryDto {
  @ApiPropertyOptional({
    example: 'equinox',
    description: 'Texto a buscar en el nombre o marca del local',
  })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringOrUndefined(value))
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({
    example: 'Miami',
    description: 'Ciudad o localidad (coincidencia parcial insensible a mayúsculas)',
  })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringOrUndefined(value))
  @IsString()
  @MaxLength(80)
  locality?: string;

  @ApiPropertyOptional({
    example: 'FL',
    description: 'Código o nombre de estado/región',
  })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringOrUndefined(value))
  @IsString()
  @MaxLength(40)
  region?: string;

  @ApiPropertyOptional({
    example: 'gym',
    description: 'Filtrar por categoría exacta del local',
  })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringOrUndefined(value))
  @IsString()
  @MaxLength(80)
  category?: string;

  @ApiPropertyOptional({
    example: 25.7617,
    description: 'Latitud GPS opcional para ordenar/filtrar por cercanía',
  })
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    example: -80.1918,
    description: 'Longitud GPS opcional para ordenar/filtrar por cercanía',
  })
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    example: 15000,
    minimum: 100,
    maximum: 100000,
    description: 'Radio máximo opcional en metros cuando se envía lat y lng',
  })
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsInt()
  @Min(100)
  @Max(100000)
  radius?: number;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 50,
    description: 'Cantidad máxima de resultados por página',
  })
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;

  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
    maximum: 5000,
    description: 'Desplazamiento para paginación',
  })
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsInt()
  @Min(0)
  @Max(5000)
  offset: number = 0;
}
