import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { RoleName } from '../../common/enums/role-name.enum.js';
import { Role } from '../../users/entities/role.entity.js';
import { User } from '../../users/entities/user.entity.js';

export async function seedAdmin(dataSource: DataSource) {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el archivo .env');
  }

  const userRepository = dataSource.getRepository(User);
  const exists = await userRepository.findOneBy({ email: email });
  if (exists) {
    console.log('El administrador ya existe');
    return;
  }

  const role = await dataSource
    .getRepository(Role)
    .findOneByOrFail({ name: RoleName.SUPERADMIN });

  const admin = userRepository.create({
    roleId: role.id,
    name: 'Administrador GADOR',
    email: email,
    password: await bcrypt.hash(password, 10),
    emailVerified: true,
  });
  await userRepository.save(admin);

  console.log('Administrador creado');
}
