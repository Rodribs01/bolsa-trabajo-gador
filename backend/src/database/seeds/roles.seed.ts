import { DataSource } from 'typeorm';
import { RoleName } from '../../common/enums/role-name.enum.js';
import { Role } from '../../users/entities/role.entity.js';

const roles = [
  { name: RoleName.SUPERADMIN, description: 'Administrador de la Gobernación' },
  { name: RoleName.COMPANY, description: 'Empresa que publica ofertas' },
  { name: RoleName.APPLICANT, description: 'Persona que busca empleo' },
];

export async function seedRoles(dataSource: DataSource) {
  const repository = dataSource.getRepository(Role);

  for (const role of roles) {
    const exists = await repository.findOneBy({ name: role.name });
    if (!exists) {
      await repository.save(repository.create(role));
    }
  }

  console.log('Roles listos');
}
