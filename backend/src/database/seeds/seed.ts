import dataSource from '../data-source.js';
import { seedAdmin } from './admin.seed.js';
import { seedCatalogs } from './catalogs.seed.js';
import { seedRoles } from './roles.seed.js';
import { seedSettings } from './settings.seed.js';
import { seedSkills } from './skills.seed.js';

async function runSeeds() {
  await dataSource.initialize();

  try {
    await seedRoles(dataSource);
    await seedCatalogs(dataSource);
    await seedSkills(dataSource);
    await seedSettings(dataSource);
    await seedAdmin(dataSource);
    console.log('Datos iniciales cargados correctamente');
  } finally {
    await dataSource.destroy();
  }
}

runSeeds().catch((error) => {
  console.error('Error al cargar los datos iniciales:', error);
  process.exit(1);
});
