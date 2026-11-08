import { DataSource } from 'typeorm';
import { Setting } from '../../catalogs/entities/setting.entity.js';

const settings = [
  {
    key: 'limite_ofertas_activas',
    value: '5',
    description: 'Cantidad máxima de ofertas activas por empresa',
  },
];

export async function seedSettings(dataSource: DataSource) {
  const repository = dataSource.getRepository(Setting);

  for (const setting of settings) {
    const exists = await repository.findOneBy({ key: setting.key });
    if (!exists) {
      await repository.save(repository.create(setting));
    }
  }

  console.log('Configuración lista');
}
