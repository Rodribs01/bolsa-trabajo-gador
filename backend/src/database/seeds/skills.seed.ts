import { DataSource } from 'typeorm';
import { Skill } from '../../catalogs/entities/skill.entity.js';

const skills = [
  { name: 'Laravel', category: 'Tecnología' },
  { name: 'PHP', category: 'Tecnología' },
  { name: 'Python', category: 'Tecnología' },
  { name: 'Java', category: 'Tecnología' },
  { name: 'JavaScript', category: 'Tecnología' },
  { name: 'TypeScript', category: 'Tecnología' },
  { name: 'Angular', category: 'Tecnología' },
  { name: 'React', category: 'Tecnología' },
  { name: 'NestJS', category: 'Tecnología' },
  { name: 'Node.js', category: 'Tecnología' },
  { name: 'MySQL', category: 'Tecnología' },
  { name: 'PostgreSQL', category: 'Tecnología' },
  { name: 'Redes', category: 'Tecnología' },
  { name: 'Linux', category: 'Tecnología' },
  { name: 'Docker', category: 'Tecnología' },
  { name: 'Git', category: 'Tecnología' },
  { name: 'Soporte técnico', category: 'Tecnología' },
  { name: 'Ofimática', category: 'Oficina' },
  { name: 'Excel avanzado', category: 'Oficina' },
  { name: 'Contabilidad', category: 'Administración' },
  { name: 'Facturación electrónica', category: 'Administración' },
  { name: 'Atención al cliente', category: 'Administración' },
  { name: 'Gestión de proyectos', category: 'Administración' },
  { name: 'AutoCAD', category: 'Técnica' },
  { name: 'Soldadura', category: 'Técnica' },
  { name: 'Mantenimiento mecánico', category: 'Técnica' },
  { name: 'Electricidad industrial', category: 'Técnica' },
  { name: 'Seguridad industrial', category: 'Técnica' },
  { name: 'Trabajo en equipo', category: 'Habilidades blandas' },
  { name: 'Liderazgo', category: 'Habilidades blandas' },
];

export async function seedSkills(dataSource: DataSource) {
  const repository = dataSource.getRepository(Skill);

  for (const skill of skills) {
    const exists = await repository.findOneBy({ name: skill.name });
    if (!exists) {
      await repository.save(repository.create(skill));
    }
  }

  console.log('Habilidades listas');
}
