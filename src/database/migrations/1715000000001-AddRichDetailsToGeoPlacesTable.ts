import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRichDetailsToGeoPlacesTable1715000000001
  implements MigrationInterface
{
  name = 'AddRichDetailsToGeoPlacesTable1715000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columnas enriquecidas a geo.places
    await queryRunner.query(`
      ALTER TABLE geo.places
        ADD COLUMN IF NOT EXISTS brand_name TEXT,
        ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS phones TEXT[],
        ADD COLUMN IF NOT EXISTS websites TEXT[],
        ADD COLUMN IF NOT EXISTS emails TEXT[],
        ADD COLUMN IF NOT EXISTS socials TEXT[],
        ADD COLUMN IF NOT EXISTS confidence NUMERIC(5, 4),
        ADD COLUMN IF NOT EXISTS operating_status TEXT DEFAULT 'open',
        ADD COLUMN IF NOT EXISTS raw_metadata JSONB;
    `);

    // 2. Índices para búsquedas de marca y código postal
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_places_brand 
      ON geo.places (brand_name);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_places_postcode 
      ON geo.places (postal_code);
    `);

    // 3. Limpiar registros previos para re-ingesta limpia con datos completos y coordenadas exactas (lon, lat)
    await queryRunner.query(`TRUNCATE TABLE geo.places;`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS geo.idx_places_postcode;`);
    await queryRunner.query(`DROP INDEX IF EXISTS geo.idx_places_brand;`);
    await queryRunner.query(`
      ALTER TABLE geo.places
        DROP COLUMN IF EXISTS raw_metadata,
        DROP COLUMN IF EXISTS operating_status,
        DROP COLUMN IF EXISTS confidence,
        DROP COLUMN IF EXISTS socials,
        DROP COLUMN IF EXISTS emails,
        DROP COLUMN IF EXISTS websites,
        DROP COLUMN IF EXISTS phones,
        DROP COLUMN IF EXISTS postal_code,
        DROP COLUMN IF EXISTS brand_name;
    `);
  }
}

