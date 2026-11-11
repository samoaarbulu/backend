import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { PlaceEntity } from '../places/entities/place.entity.js';
import { CreateGeoPlacesTable1715000000000 } from './migrations/1715000000000-CreateGeoPlacesTable.js';
import { AddRichDetailsToGeoPlacesTable1715000000001 } from './migrations/1715000000001-AddRichDetailsToGeoPlacesTable.js';

const rawUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!rawUrl) {
  throw new Error(
    'Falta configurar DIRECT_URL o DATABASE_URL en las variables de entorno (.env).',
  );
}

const cleanUrl = rawUrl
  .replace(/([?&])sslmode=[^&]+(&|$)/, '$1')
  .replace(/([?&])schema=[^&]+(&|$)/, '$1')
  .replace(/[?&]$/, '');

export const dataSourceOptions: DataSourceOptions = {
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
    rejectUnauthorized: false, // Permite el certificado SSL autofirmado del VPS en desarrollo
  },
  extra: {
    ssl: {
      rejectUnauthorized: false,
    },
    options: '-c search_path=geo,ranking,auth_core,views,public',
  },
};

export const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
