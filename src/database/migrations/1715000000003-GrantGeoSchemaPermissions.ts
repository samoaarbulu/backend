import { MigrationInterface, QueryRunner } from 'typeorm';

export class GrantGeoSchemaPermissions1715000000003
  implements MigrationInterface
{
  name = 'GrantGeoSchemaPermissions1715000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        app_role TEXT;
      BEGIN
        FOREACH app_role IN ARRAY ARRAY['creds_app_user_dev', 'creds_app_user_prod']
        LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = app_role) THEN
            EXECUTE format('GRANT USAGE ON SCHEMA geo TO %I', app_role);
            EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA geo TO %I', app_role);
            EXECUTE format('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA geo TO %I', app_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE creds_user IN SCHEMA geo GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I', app_role);
            EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE creds_user IN SCHEMA geo GRANT USAGE, SELECT ON SEQUENCES TO %I', app_role);
          END IF;
        END LOOP;
      END
      $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        app_role TEXT;
      BEGIN
        FOREACH app_role IN ARRAY ARRAY['creds_app_user_dev', 'creds_app_user_prod']
        LOOP
          IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = app_role) THEN
            EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA geo FROM %I', app_role);
            EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA geo FROM %I', app_role);
            EXECUTE format('REVOKE USAGE ON SCHEMA geo FROM %I', app_role);
          END IF;
        END LOOP;
      END
      $$;
    `);
  }
}
