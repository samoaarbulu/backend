import 'dotenv/config';
import AppDataSource from './data-source.js';

async function run() {
  console.log('===========================================================');
  console.log('📦 CREDS - Ejecutor Oficial de Migraciones NestJS');
  console.log('===========================================================');
  
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida con PostgreSQL.');

    const pending = await AppDataSource.showMigrations();
    console.log(`🔍 Migraciones pendientes detectadas: ${pending ? 'Sí' : 'No'}`);

    console.log('🚀 Ejecutando migraciones...');
    const applied = await AppDataSource.runMigrations();

    if (applied.length === 0) {
      console.log('✨ La base de datos ya está al día. No hubo cambios.');
    } else {
      console.log(`🎉 Se aplicaron exitosamente ${applied.length} migración(es):`);
      for (const m of applied) {
        console.log(`   • ${m.name}`);
      }
    }

    await AppDataSource.destroy();
    console.log('===========================================================');
  } catch (error) {
    console.error('❌ Error durante la ejecución de migraciones:', error);
    process.exit(1);
  }
}

run();

