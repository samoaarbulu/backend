import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGeoPlacesTable1715000000000 implements MigrationInterface {
  name = 'CreateGeoPlacesTable1715000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Extensiones del sistema en PostgreSQL
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // 2. Esquema de Dominio 'geo'
    await queryRunner.query(`CREATE SCHEMA IF NOT EXISTS geo;`);

    // 3. Tabla geo.places
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS geo.places (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        external_id TEXT UNIQUE,
        name TEXT NOT NULL,
        category TEXT,
        address TEXT,
        locality TEXT,
        region TEXT,
        country VARCHAR(5) NOT NULL DEFAULT 'US',
        coordinates GEOMETRY(Point, 4326),
        source TEXT NOT NULL DEFAULT 'overture_maps',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 4. Índices de Alto Rendimiento
    // Índice espacial GiST para Bounding Box (< 10 ms) y ST_DWithin
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_places_coordinates 
      ON geo.places USING GIST (coordinates);
    `);

    // Índice GIN Trigram para búsqueda de texto difuso (fuzzy search) a $0 USD
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_places_name_trgm 
      ON geo.places USING GIN (name gin_trgm_ops);
    `);

    // Índice para filtrado por categoría
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_places_category 
      ON geo.places (category);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS geo.idx_places_category;`);
    await queryRunner.query(`DROP INDEX IF EXISTS geo.idx_places_name_trgm;`);
    await queryRunner.query(`DROP INDEX IF EXISTS geo.idx_places_coordinates;`);
    await queryRunner.query(`DROP TABLE IF EXISTS geo.places;`);
  }
}

