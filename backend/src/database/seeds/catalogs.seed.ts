import { DataSource, IsNull, Repository } from 'typeorm';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { CatalogType } from '../../common/enums/catalog-type.enum.js';

const sectors = [
  'Minería',
  'Tecnología',
  'Comercio',
  'Salud',
  'Educación',
  'Construcción',
  'Servicios',
  'Transporte',
  'Agropecuario',
  'Turismo',
];

const professions = [
  'Ingeniería de Sistemas',
  'Ingeniería Informática',
  'Ingeniería de Software',
  'Técnico Superior en Sistemas Informáticos',
  'Ingeniería Industrial',
  'Ingeniería de Minas',
  'Ingeniería Metalúrgica',
  'Ingeniería Civil',
  'Ingeniería Eléctrica',
  'Ingeniería Electrónica',
  'Ingeniería Mecánica',
  'Electromecánica',
  'Mecánica Industrial',
  'Contaduría Pública',
  'Administración de Empresas',
  'Economía',
  'Derecho',
  'Medicina',
  'Enfermería',
  'Bioquímica',
  'Ciencias de la Educación',
  'Comunicación Social',
  'Arquitectura',
  'Agronomía',
  'Turismo',
  'Secretariado Ejecutivo',
];

const contractTypes = [
  'Indefinido',
  'Plazo fijo',
  'Eventual',
  'Pasantía',
  'Consultoría',
];

const modalities = ['Presencial', 'Remoto', 'Híbrido'];

const departments = [
  'Oruro',
  'La Paz',
  'Cochabamba',
  'Santa Cruz',
  'Potosí',
  'Chuquisaca',
  'Tarija',
  'Beni',
  'Pando',
];

// Los 35 municipios del departamento de Oruro
const oruroMunicipalities = [
  'Oruro',
  'Caracollo',
  'El Choro',
  'Soracachi',
  'Challapata',
  'Santuario de Quillacas',
  'Corque',
  'Choquecota',
  'Curahuara de Carangas',
  'Turco',
  'Huachacalla',
  'Escara',
  'Cruz de Machacamarca',
  'Yunguyo de Litoral',
  'Esmeralda',
  'Poopó',
  'Pazña',
  'Antequera',
  'Huanuni',
  'Machacamarca',
  'Salinas de Garci Mendoza',
  'Pampa Aullagas',
  'Sabaya',
  'Coipasa',
  'Chipaya',
  'Toledo',
  'Eucaliptus',
  'Santiago de Andamarca',
  'Belén de Andamarca',
  'Totora',
  'Santiago de Huari',
  'La Rivera',
  'Todos Santos',
  'Carangas',
  'Huayllamarca',
];

const languages = [
  'Castellano',
  'Quechua',
  'Aymara',
  'Guaraní',
  'Inglés',
  'Portugués',
  'Francés',
];

async function saveList(
  repository: Repository<Catalog>,
  type: CatalogType,
  names: string[],
  parentId: number | null = null,
) {
  for (let i = 0; i < names.length; i++) {
    const exists = await repository.findOneBy({
      type: type,
      name: names[i],
      parentId: parentId === null ? IsNull() : parentId,
    });
    if (!exists) {
      await repository.save(
        repository.create({
          type: type,
          name: names[i],
          parentId: parentId,
          order: i + 1,
        }),
      );
    }
  }
}

export async function seedCatalogs(dataSource: DataSource) {
  const repository = dataSource.getRepository(Catalog);

  await saveList(repository, CatalogType.SECTOR, sectors);
  await saveList(repository, CatalogType.PROFESSION, professions);
  await saveList(repository, CatalogType.CONTRACT_TYPE, contractTypes);
  await saveList(repository, CatalogType.MODALITY, modalities);
  await saveList(repository, CatalogType.DEPARTMENT, departments);
  await saveList(repository, CatalogType.LANGUAGE, languages);

  const oruro = await repository.findOneByOrFail({
    type: CatalogType.DEPARTMENT,
    name: 'Oruro',
  });
  await saveList(
    repository,
    CatalogType.MUNICIPALITY,
    oruroMunicipalities,
    oruro.id,
  );

  console.log('Catálogos listos');
}
