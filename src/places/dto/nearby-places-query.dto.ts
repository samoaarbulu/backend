import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

function toNumberOrUndefined(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Number(value);
}

function toTrimmedStringOrUndefined(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export class NearbyPlacesQueryDto {
  @ApiProperty({
    example: 25.7617,
    description: 'Latitud GPS en grados decimales (WGS84, -90 a 90)',
  })
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-90)
  @Max(90)
  lat: number;

  @ApiProperty({
    example: -80.1918,
    description: 'Longitud GPS en grados decimales (WGS84, -180 a 180)',
  })
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Min(-180)
  @Max(180)
  lng: number;

  @ApiPropertyOptional({
    default: 3000,
    minimum: 50,
    maximum: 25000,
    description: 'Radio de búsqueda en metros (por defecto 3000 m = 3 km)',
  })
  @IsOptional()
  @Transform(({ value }) => toNumberOrUndefined(value))
  @IsInt()
  @Min(50)
  @Max(25000)
  radius: number = 3000;

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
    example: 'equinox',
    description: 'Búsqueda de texto por nombre o marca',
  })
  @IsOptional()
  @Transform(({ value }) => toTrimmedStringOrUndefined(value))
  @IsString()
  @MaxLength(100)
  q?: string;

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

