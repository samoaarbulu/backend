import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PlaceEntity } from '../places/entities/place.entity.js';
import { CreateGeoPlacesTable1715000000000 } from './migrations/1715000000000-CreateGeoPlacesTable.js';
import { AddRichDetailsToGeoPlacesTable1715000000001 } from './migrations/1715000000001-AddRichDetailsToGeoPlacesTable.js';

export function buildDataSourceOptions(rawUrl?: string): DataSourceOptions {
  if (!rawUrl) {
    throw new Error(
      'Falta configurar DATABASE_URL o DIRECT_URL en las variables de entorno (.env).',
    );
  }

  const cleanUrl = rawUrl
    .replace(/([?&])sslmode=[^&]+(&|$)/, '$1')
    .replace(/([?&])schema=[^&]+(&|$)/, '$1')
    .replace(/[?&]$/, '');

  return {
    type: 'postgres',
    url: cleanUrl,
    entities: [PlaceEntity],
    migrations: [
      CreateGeoPlacesTable1715000000000,
      AddRichDetailsToGeoPlacesTable1715000000001,
    ],
    synchronize: false, // Prohibido true en arquitectura CREDS
    logging: process.env.NODE_ENV === 'development',
    ssl: {
      rejectUnauthorized: false, // Permite el certificado SSL autofirmado del VPS
    },
    extra: {
      ssl: {
        rejectUnauthorized: false,
      },
      options: '-c search_path=geo,ranking,auth_core,views,public',
    },
  };
}

// DataSource exclusivo para CLI / Migraciones DDL (usa DIRECT_URL -> creds_user)
export const AppDataSource = new DataSource(
  buildDataSourceOptions(process.env.DIRECT_URL || process.env.DATABASE_URL),
);

export default AppDataSource;
