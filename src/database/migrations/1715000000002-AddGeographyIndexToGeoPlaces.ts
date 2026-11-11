import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGeographyIndexToGeoPlaces1715000000002
  implements MigrationInterface
{
  name = 'AddGeographyIndexToGeoPlaces1715000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Índice GiST funcional sobre geography para ST_DWithin/ST_Distance en metros exactos a escala global
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_places_coordinates_geog
      ON geo.places USING GIST ((coordinates::geography));
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS geo.idx_places_coordinates_geog;`,
    );
  }
}
