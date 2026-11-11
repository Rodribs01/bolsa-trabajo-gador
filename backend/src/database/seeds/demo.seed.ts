import * as bcrypt from 'bcryptjs';
import { EntityManager } from 'typeorm';
import { ApplicantLanguage } from '../../applicants/entities/applicant-language.entity.js';
import { ApplicantProfile } from '../../applicants/entities/applicant-profile.entity.js';
import { ApplicantSkill } from '../../applicants/entities/applicant-skill.entity.js';
import { Education } from '../../applicants/entities/education.entity.js';
import { Experience } from '../../applicants/entities/experience.entity.js';
import { Application } from '../../applications/entities/application.entity.js';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { Skill } from '../../catalogs/entities/skill.entity.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { CatalogType } from '../../common/enums/catalog-type.enum.js';
import { CompanyStatus } from '../../common/enums/company-status.enum.js';
import { JobOfferStatus } from '../../common/enums/job-offer-status.enum.js';
import { LanguageLevel } from '../../common/enums/language-level.enum.js';
import { NotificationType } from '../../common/enums/notification-type.enum.js';
import { RoleName } from '../../common/enums/role-name.enum.js';
import { SkillLevel } from '../../common/enums/skill-level.enum.js';
import { Company } from '../../companies/entities/company.entity.js';
import { Favorite } from '../../job-offers/entities/favorite.entity.js';
import { JobOfferProfession } from '../../job-offers/entities/job-offer-profession.entity.js';
import { JobOfferSkill } from '../../job-offers/entities/job-offer-skill.entity.js';
import { JobOffer } from '../../job-offers/entities/job-offer.entity.js';
import { Notification } from '../../notifications/entities/notification.entity.js';
import { Role } from '../../users/entities/role.entity.js';
import { User } from '../../users/entities/user.entity.js';
import dataSource from '../data-source.js';

const DAY = 24 * 60 * 60 * 1000;
const FIRST_DEMO_EMAIL = 'sistemas.andinos@demo.bo';

interface OfferSkillData {
  name: string;
  required: boolean;
}

interface OfferData {
  company: Company;
  title: string;
  description: string;
  required: string;
  desired: string | null;
  years: number;
  contract: string;
  modality: string;
  municipality: string;
  minSalary: number | null;
  maxSalary: number | null;
  closingInDays: number;
  vacancies: number;
  status: JobOfferStatus;
  publishedDaysAgo: number | null;
  createdDaysAgo: number;
  views: number;
  professions: string[];
  skills: OfferSkillData[];
}

interface ApplicantData {
  email: string;
  ci: string;
  firstNames: string;
  lastNames: string;
  profession: string;
  createdDaysAgo: number;
  education: string;
  experience: string;
  skills: string[];
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * DAY);
}

function dateInBolivia(daysFromToday: number): string {
  return new Date(Date.now() + daysFromToday * DAY).toLocaleDateString(
    'en-CA',
    { timeZone: 'America/La_Paz' },
  );
}

async function findCatalog(
  db: EntityManager,
  type: CatalogType,
  name: string,
): Promise<Catalog> {
  return db.getRepository(Catalog).findOneByOrFail({ type: type, name: name });
}

async function findSkill(db: EntityManager, name: string): Promise<Skill> {
  return db.getRepository(Skill).findOneByOrFail({ name: name });
}

async function createUser(
  db: EntityManager,
  role: RoleName,
  name: string,
  email: string,
  phone: string,
  passwordHash: string,
): Promise<User> {
  const roleRow = await db.getRepository(Role).findOneByOrFail({ name: role });
  const repository = db.getRepository(User);
  return repository.save(
    repository.create({
      roleId: roleRow.id,
      name: name,
      email: email,
      phone: phone,
      password: passwordHash,
      emailVerified: true,
    }),
  );
}

async function setCreatedAt(
  db: EntityManager,
  entity: typeof ApplicantProfile | typeof Application | typeof JobOffer,
  id: number,
  date: Date,
): Promise<void> {
  await db
    .createQueryBuilder()
    .update(entity)
    .set({ createdAt: date, updatedAt: date })
    .where('id = :id', { id: id })
    .execute();
}

async function createCompany(
  db: EntityManager,
  passwordHash: string,
  admin: User,
  data: {
    email: string;
    nit: string;
    name: string;
    sector: string;
    representative: string;
    representativeCi: string;
    phone: string;
    address: string;
    employees: number;
    logo: string | null;
    document: string;
    description: string;
    status: CompanyStatus;
  },
): Promise<Company> {
  const user = await createUser(
    db,
    RoleName.COMPANY,
    data.name,
    data.email,
    data.phone,
    passwordHash,
  );
  const sector = await findCatalog(db, CatalogType.SECTOR, data.sector);
  const municipality = await findCatalog(db, CatalogType.MUNICIPALITY, 'Oruro');
  const approved = data.status === CompanyStatus.APPROVED;
  const repository = db.getRepository(Company);
  return repository.save(
    repository.create({
      userId: user.id,
      nit: data.nit,
      businessName: data.name,
      sectorId: sector.id,
      legalRepresentative: data.representative,
      representativeCi: data.representativeCi,
      phone: data.phone,
      corporateEmail: data.email,
      address: data.address,
      municipalityId: municipality.id,
      employeeCount: data.employees,
      logo: data.logo,
      supportDocument: data.document,
      description: data.description,
      status: data.status,
      validatedById: approved ? admin.id : null,
      validatedAt: approved ? daysAgo(150) : null,
    }),
  );
}

async function createOffer(
  db: EntityManager,
  data: OfferData,
): Promise<JobOffer> {
  const contract = await findCatalog(
    db,
    CatalogType.CONTRACT_TYPE,
    data.contract,
  );
  const modality = await findCatalog(db, CatalogType.MODALITY, data.modality);
  const municipality = await findCatalog(
    db,
    CatalogType.MUNICIPALITY,
    data.municipality,
  );
  const repository = db.getRepository(JobOffer);
  const offer = await repository.save(
    repository.create({
      companyId: data.company.id,
      title: data.title,
      description: data.description,
      requiredRequirements: data.required,
      desiredRequirements: data.desired,
      yearsOfExperience: data.years,
      contractTypeId: contract.id,
      modalityId: modality.id,
      municipalityId: municipality.id,
      minSalary: data.minSalary,
      maxSalary: data.maxSalary,
      salaryToNegotiate: data.minSalary === null,
      benefits: ['Seguro de salud (CNS)', 'Aguinaldo', 'Vacaciones de ley'],
      closingDate: dateInBolivia(data.closingInDays),
      vacancies: data.vacancies,
      status: data.status,
      totalViews: data.views,
      publishedAt:
        data.publishedDaysAgo === null ? null : daysAgo(data.publishedDaysAgo),
    }),
  );
  await setCreatedAt(db, JobOffer, offer.id, daysAgo(data.createdDaysAgo));

  for (const name of data.professions) {
    const profession = await findCatalog(db, CatalogType.PROFESSION, name);
    await db
      .getRepository(JobOfferProfession)
      .save({ jobOfferId: offer.id, professionId: profession.id });
  }
  for (const item of data.skills) {
    const skill = await findSkill(db, item.name);
    await db.getRepository(JobOfferSkill).save({
      jobOfferId: offer.id,
      skillId: skill.id,
      required: item.required,
    });
  }
  return offer;
}

// Misma fórmula del sistema: obligatoria pesa 2 y deseable 1
function matchPercentage(offer: OfferData, applicantSkills: string[]): number {
  let total = 0;
  let matched = 0;
  for (const item of offer.skills) {
    const weight = item.required ? 2 : 1;
    total += weight;
    if (applicantSkills.includes(item.name)) {
      matched += weight;
    }
  }
  if (total === 0) {
    return 0;
  }
  return Math.round((matched / total) * 100);
}

async function createApplication(
  db: EntityManager,
  offer: JobOffer,
  offerData: OfferData,
  profile: ApplicantProfile,
  profileSkills: string[],
  status: ApplicationStatus,
  createdDaysAgo: number,
): Promise<void> {
  const repository = db.getRepository(Application);
  const application = await repository.save(
    repository.create({
      jobOfferId: offer.id,
      profileId: profile.id,
      status: status,
      matchPercentage: matchPercentage(offerData, profileSkills),
      seenAt:
        status === ApplicationStatus.APPLIED
          ? null
          : daysAgo(createdDaysAgo - 1),
    }),
  );
  await setCreatedAt(db, Application, application.id, daysAgo(createdDaysAgo));
}

async function createMainApplicant(
  db: EntityManager,
  passwordHash: string,
): Promise<ApplicantProfile> {
  const user = await createUser(
    db,
    RoleName.APPLICANT,
    'María Fernanda Quispe Mamani',
    'postulante@demo.bo',
    '71234567',
    passwordHash,
  );
  const municipality = await findCatalog(db, CatalogType.MUNICIPALITY, 'Oruro');
  const profession = await findCatalog(
    db,
    CatalogType.PROFESSION,
    'Ingeniería de Sistemas',
  );
  const profileRepository = db.getRepository(ApplicantProfile);
  const profile = await profileRepository.save(
    profileRepository.create({
      userId: user.id,
      ci: '7354821',
      ciIssuedIn: 'OR',
      firstNames: 'María Fernanda',
      lastNames: 'Quispe Mamani',
      birthDate: '1997-05-14',
      address: 'Calle Bolívar 456, zona central',
      municipalityId: municipality.id,
      professionId: profession.id,
      photo: 'demo-foto-postulante.png',
      cv: 'demo-cv-postulante.pdf',
      summary:
        'Ingeniera de Sistemas con más de cuatro años de experiencia en desarrollo web con Angular y bases de datos MySQL.',
      completionPercentage: 100,
    }),
  );
  await setCreatedAt(db, ApplicantProfile, profile.id, daysAgo(40));

  await db.getRepository(Education).save({
    profileId: profile.id,
    title: 'Licenciatura en Ingeniería de Sistemas',
    institution: 'Universidad Técnica de Oruro',
    graduationYear: 2021,
    nationalTitleNumber: 'TPN-2021-04512',
  });
  await db.getRepository(Experience).save([
    {
      profileId: profile.id,
      company: 'Soluciones Digitales Oruro',
      position: 'Desarrolladora web',
      location: 'Oruro',
      startDate: '2022-03-01',
      endDate: null,
      years: 4,
      description: 'Desarrollo de sistemas web con Angular, Node.js y MySQL.',
    },
    {
      profileId: profile.id,
      company: 'Cooperativa San José',
      position: 'Técnica de soporte',
      location: 'Oruro',
      startDate: '2021-02-01',
      endDate: '2022-02-28',
      years: 1,
      description: 'Mantenimiento de equipos, redes y atención a usuarios.',
    },
  ]);
  const skills: [string, SkillLevel][] = [
    ['Angular', SkillLevel.ADVANCED],
    ['TypeScript', SkillLevel.ADVANCED],
    ['JavaScript', SkillLevel.ADVANCED],
    ['MySQL', SkillLevel.INTERMEDIATE],
    ['Git', SkillLevel.INTERMEDIATE],
    ['Trabajo en equipo', SkillLevel.ADVANCED],
  ];
  for (const [name, level] of skills) {
    const skill = await findSkill(db, name);
    await db
      .getRepository(ApplicantSkill)
      .save({ profileId: profile.id, skillId: skill.id, level: level });
  }
  const languages: [string, LanguageLevel][] = [
    ['Castellano', LanguageLevel.NATIVE],
    ['Inglés', LanguageLevel.INTERMEDIATE],
    ['Quechua', LanguageLevel.BASIC],
  ];
  for (const [name, level] of languages) {
    const language = await findCatalog(db, CatalogType.LANGUAGE, name);
    await db
      .getRepository(ApplicantLanguage)
      .save({ profileId: profile.id, languageId: language.id, level: level });
  }
  return profile;
}

// Perfiles al 85 %: datos, formación, experiencia, habilidades y CV (sin foto ni idiomas)
async function createApplicant(
  db: EntityManager,
  passwordHash: string,
  data: ApplicantData,
): Promise<ApplicantProfile> {
  const user = await createUser(
    db,
    RoleName.APPLICANT,
    `${data.firstNames} ${data.lastNames}`,
    data.email,
    '7' + data.ci.slice(0, 7),
    passwordHash,
  );
  const municipality = await findCatalog(db, CatalogType.MUNICIPALITY, 'Oruro');
  const profession = await findCatalog(
    db,
    CatalogType.PROFESSION,
    data.profession,
  );
  const profileRepository = db.getRepository(ApplicantProfile);
  const profile = await profileRepository.save(
    profileRepository.create({
      userId: user.id,
      ci: data.ci,
      ciIssuedIn: 'OR',
      firstNames: data.firstNames,
      lastNames: data.lastNames,
      birthDate: '1994-08-20',
      address: 'Oruro',
      municipalityId: municipality.id,
      professionId: profession.id,
      cv: 'demo-cv-generico.pdf',
      summary: `Profesional en ${data.profession.toLowerCase()} con experiencia en Oruro.`,
      completionPercentage: 85,
    }),
  );
  await setCreatedAt(
    db,
    ApplicantProfile,
    profile.id,
    daysAgo(data.createdDaysAgo),
  );
  await db.getRepository(Education).save({
    profileId: profile.id,
    title: data.education,
    institution: 'Universidad Técnica de Oruro',
    graduationYear: 2018,
    nationalTitleNumber: null,
  });
  await db.getRepository(Experience).save({
    profileId: profile.id,
    company: data.experience,
    position: 'Técnico',
    location: 'Oruro',
    startDate: '2019-01-15',
    endDate: '2024-12-31',
    years: 5,
    description: 'Experiencia en el área de su profesión.',
  });
  for (const name of data.skills) {
    const skill = await findSkill(db, name);
    await db.getRepository(ApplicantSkill).save({
      profileId: profile.id,
      skillId: skill.id,
      level: SkillLevel.INTERMEDIATE,
    });
  }
  return profile;
}

async function seedDemo(db: EntityManager, password: string): Promise<void> {
  const passwordHash = await bcrypt.hash(password, 10);
  const adminRole = await db
    .getRepository(Role)
    .findOneByOrFail({ name: RoleName.SUPERADMIN });
  const admin = await db
    .getRepository(User)
    .findOneByOrFail({ roleId: adminRole.id });

  const sistemas = await createCompany(db, passwordHash, admin, {
    email: FIRST_DEMO_EMAIL,
    nit: '1023456027',
    name: 'Sistemas Andinos S.R.L.',
    sector: 'Tecnología',
    representative: 'Juan Carlos Flores Rojas',
    representativeCi: '4128765',
    phone: '72451398',
    address: 'Av. 6 de Agosto 1234, Oruro',
    employees: 35,
    logo: 'demo-logo-sistemas.png',
    document: 'demo-nit-sistemas.pdf',
    description:
      'Empresa orureña de desarrollo de software y soporte informático con más de 10 años de experiencia.',
    status: CompanyStatus.APPROVED,
  });
  const minera = await createCompany(db, passwordHash, admin, {
    email: 'minera.poopo@demo.bo',
    nit: '2087451012',
    name: 'Minera Poopó Sur S.A.',
    sector: 'Minería',
    representative: 'Rosa Elena Choque Villca',
    representativeCi: '3984512',
    phone: '72589641',
    address: 'Carretera a Huanuni km 8, Oruro',
    employees: 220,
    logo: 'demo-logo-minera.png',
    document: 'demo-nit-minera.pdf',
    description:
      'Empresa minera del sur del departamento dedicada a la explotación de estaño y zinc.',
    status: CompanyStatus.APPROVED,
  });
  await createCompany(db, passwordHash, admin, {
    email: 'comercial.altiplano@demo.bo',
    nit: '3045871016',
    name: 'Comercial El Altiplano Ltda.',
    sector: 'Comercio',
    representative: 'Pedro Gutiérrez Mendoza',
    representativeCi: '5214785',
    phone: '76321458',
    address: 'Calle Junín 789, Oruro',
    employees: 18,
    logo: null,
    document: 'demo-nit-comercial.pdf',
    description:
      'Distribuidora de productos de consumo masivo en el departamento de Oruro.',
    status: CompanyStatus.PENDING,
  });

  const offersData: OfferData[] = [
    {
      company: sistemas,
      title: 'Desarrollador(a) Web Angular',
      description:
        'Buscamos un desarrollador web para construir sistemas para instituciones públicas y privadas de Oruro.',
      required:
        'Título en Ingeniería de Sistemas o Informática.\nExperiencia con Angular y TypeScript.',
      desired: 'Experiencia con MySQL y Git.',
      years: 1,
      contract: 'Plazo fijo',
      modality: 'Híbrido',
      municipality: 'Oruro',
      minSalary: 6000,
      maxSalary: 8000,
      closingInDays: 20,
      vacancies: 2,
      status: JobOfferStatus.PUBLISHED,
      publishedDaysAgo: 3,
      createdDaysAgo: 5,
      views: 48,
      professions: ['Ingeniería de Sistemas', 'Ingeniería Informática'],
      skills: [
        { name: 'Angular', required: true },
        { name: 'TypeScript', required: true },
        { name: 'MySQL', required: false },
        { name: 'Git', required: false },
      ],
    },
    {
      company: sistemas,
      title: 'Técnico(a) en Soporte Informático',
      description:
        'Atención a usuarios, mantenimiento de equipos y redes en nuestras oficinas y clientes.',
      required:
        'Título de técnico superior en sistemas o afín.\nDisponibilidad inmediata.',
      desired: 'Conocimientos de Linux.',
      years: 1,
      contract: 'Plazo fijo',
      modality: 'Presencial',
      municipality: 'Oruro',
      minSalary: 4500,
      maxSalary: 4500,
      closingInDays: 12,
      vacancies: 1,
      status: JobOfferStatus.PUBLISHED,
      publishedDaysAgo: 10,
      createdDaysAgo: 12,
      views: 31,
      professions: [
        'Técnico Superior en Sistemas Informáticos',
        'Ingeniería de Sistemas',
      ],
      skills: [
        { name: 'Soporte técnico', required: true },
        { name: 'Redes', required: true },
        { name: 'Linux', required: false },
      ],
    },
    {
      company: sistemas,
      title: 'Analista de Datos',
      description:
        'Análisis de información y elaboración de reportes para clientes.',
      required: 'Título en Ingeniería de Sistemas, Informática o Economía.',
      desired: null,
      years: 2,
      contract: 'Consultoría',
      modality: 'Remoto',
      municipality: 'Oruro',
      minSalary: 7000,
      maxSalary: 9000,
      closingInDays: -95,
      vacancies: 1,
      status: JobOfferStatus.CLOSED,
      publishedDaysAgo: 125,
      createdDaysAgo: 128,
      views: 64,
      professions: ['Ingeniería Informática', 'Economía'],
      skills: [
        { name: 'Python', required: true },
        { name: 'MySQL', required: true },
        { name: 'Excel avanzado', required: false },
      ],
    },
    {
      company: minera,
      title: 'Ingeniero(a) de Minas',
      description:
        'Planificación y supervisión de las operaciones de la mina subterránea en Huanuni.',
      required:
        'Título en Ingeniería de Minas.\nTres años de experiencia en minería subterránea.',
      desired: 'Manejo de AutoCAD.',
      years: 3,
      contract: 'Indefinido',
      modality: 'Presencial',
      municipality: 'Huanuni',
      minSalary: 9500,
      maxSalary: 11000,
      closingInDays: 25,
      vacancies: 1,
      status: JobOfferStatus.PUBLISHED,
      publishedDaysAgo: 6,
      createdDaysAgo: 8,
      views: 22,
      professions: ['Ingeniería de Minas', 'Ingeniería Metalúrgica'],
      skills: [
        { name: 'Seguridad industrial', required: true },
        { name: 'AutoCAD', required: false },
        { name: 'Gestión de proyectos', required: false },
      ],
    },
    {
      company: minera,
      title: 'Mecánico(a) de mantenimiento',
      description:
        'Mantenimiento preventivo y correctivo de maquinaria minera.',
      required: 'Título de técnico en mecánica industrial.',
      desired: 'Experiencia en soldadura.',
      years: 2,
      contract: 'Eventual',
      modality: 'Presencial',
      municipality: 'Huanuni',
      minSalary: null,
      maxSalary: null,
      closingInDays: -2,
      vacancies: 2,
      status: JobOfferStatus.IN_SELECTION,
      publishedDaysAgo: 40,
      createdDaysAgo: 42,
      views: 39,
      professions: ['Mecánica Industrial', 'Electromecánica'],
      skills: [
        { name: 'Mantenimiento mecánico', required: true },
        { name: 'Soldadura', required: false },
      ],
    },
    {
      company: minera,
      title: 'Técnico(a) en Seguridad Industrial',
      description:
        'Control del cumplimiento de las normas de seguridad en interior mina.',
      required: 'Título de técnico o licenciatura en seguridad industrial.',
      desired: null,
      years: 2,
      contract: 'Plazo fijo',
      modality: 'Presencial',
      municipality: 'Huanuni',
      minSalary: 4600,
      maxSalary: 5200,
      closingInDays: 30,
      vacancies: 1,
      status: JobOfferStatus.IN_REVIEW,
      publishedDaysAgo: null,
      createdDaysAgo: 1,
      views: 0,
      professions: ['Ingeniería Industrial'],
      skills: [
        { name: 'Seguridad industrial', required: true },
        { name: 'Trabajo en equipo', required: false },
      ],
    },
  ];
  const offers: JobOffer[] = [];
  for (const data of offersData) {
    offers.push(await createOffer(db, data));
  }

  const main = await createMainApplicant(db, passwordHash);
  const mainSkills = [
    'Angular',
    'TypeScript',
    'JavaScript',
    'MySQL',
    'Git',
    'Trabajo en equipo',
  ];
  await createApplication(
    db,
    offers[1],
    offersData[1],
    main,
    mainSkills,
    ApplicationStatus.SHORTLISTED,
    8,
  );
  await createApplication(
    db,
    offers[2],
    offersData[2],
    main,
    mainSkills,
    ApplicationStatus.REJECTED,
    120,
  );
  await db
    .getRepository(Favorite)
    .save({ profileId: main.id, jobOfferId: offers[3].id });

  const others: ApplicantData[] = [
    {
      email: 'carlos.mamani@demo.bo',
      ci: '6541238',
      firstNames: 'Carlos',
      lastNames: 'Mamani Huanca',
      profession: 'Técnico Superior en Sistemas Informáticos',
      createdDaysAgo: 150,
      education: 'Técnico Superior en Sistemas Informáticos',
      experience: 'Centro de Cómputo Oruro',
      skills: ['Soporte técnico', 'Redes', 'Linux'],
    },
    {
      email: 'lucia.flores@demo.bo',
      ci: '5874126',
      firstNames: 'Lucía',
      lastNames: 'Flores Gutiérrez',
      profession: 'Ingeniería Informática',
      createdDaysAgo: 135,
      education: 'Licenciatura en Ingeniería Informática',
      experience: 'Datos y Estadística S.R.L.',
      skills: ['Python', 'MySQL', 'Excel avanzado', 'Angular'],
    },
    {
      email: 'jorge.choque@demo.bo',
      ci: '4785123',
      firstNames: 'Jorge',
      lastNames: 'Choque Llanos',
      profession: 'Ingeniería de Minas',
      createdDaysAgo: 75,
      education: 'Licenciatura en Ingeniería de Minas',
      experience: 'Empresa Minera Huanuni',
      skills: ['Seguridad industrial', 'AutoCAD', 'Gestión de proyectos'],
    },
    {
      email: 'ana.condori@demo.bo',
      ci: '6321457',
      firstNames: 'Ana',
      lastNames: 'Condori Vela',
      profession: 'Mecánica Industrial',
      createdDaysAgo: 60,
      education: 'Técnico Superior en Mecánica Industrial',
      experience: 'Taller Industrial Oruro',
      skills: ['Mantenimiento mecánico', 'Soldadura'],
    },
    {
      email: 'roberto.vargas@demo.bo',
      ci: '5987412',
      firstNames: 'Roberto',
      lastNames: 'Vargas Colque',
      profession: 'Electromecánica',
      createdDaysAgo: 20,
      education: 'Técnico Superior en Electromecánica',
      experience: 'Servicios Eléctricos del Altiplano',
      skills: ['Mantenimiento mecánico', 'Electricidad industrial'],
    },
  ];
  const profiles: ApplicantProfile[] = [];
  for (const data of others) {
    profiles.push(await createApplicant(db, passwordHash, data));
  }

  await createApplication(
    db,
    offers[1],
    offersData[1],
    profiles[0],
    others[0].skills,
    ApplicationStatus.SEEN,
    9,
  );
  await createApplication(
    db,
    offers[2],
    offersData[2],
    profiles[0],
    others[0].skills,
    ApplicationStatus.REJECTED,
    122,
  );
  await createApplication(
    db,
    offers[2],
    offersData[2],
    profiles[1],
    others[1].skills,
    ApplicationStatus.HIRED,
    118,
  );
  await createApplication(
    db,
    offers[0],
    offersData[0],
    profiles[1],
    others[1].skills,
    ApplicationStatus.APPLIED,
    2,
  );
  await createApplication(
    db,
    offers[3],
    offersData[3],
    profiles[2],
    others[2].skills,
    ApplicationStatus.INTERVIEW,
    5,
  );
  await createApplication(
    db,
    offers[4],
    offersData[4],
    profiles[2],
    others[2].skills,
    ApplicationStatus.REJECTED,
    38,
  );
  await createApplication(
    db,
    offers[4],
    offersData[4],
    profiles[3],
    others[3].skills,
    ApplicationStatus.HIRED,
    36,
  );
  await createApplication(
    db,
    offers[4],
    offersData[4],
    profiles[4],
    others[4].skills,
    ApplicationStatus.FINALIST,
    15,
  );

  await db.getRepository(Notification).save([
    {
      userId: main.userId,
      type: NotificationType.CV_VIEWED,
      title: 'Una empresa revisó tu postulación',
      message: `Sistemas Andinos S.R.L. abrió tu perfil para la oferta "${offersData[1].title}".`,
      link: '/applicant/applications',
    },
    {
      userId: main.userId,
      type: NotificationType.APPLICATION_STATUS,
      title: 'Tu postulación cambió de estado',
      message: `Tu postulación a "${offersData[1].title}" pasó al estado "Preseleccionado".`,
      link: '/applicant/applications',
    },
  ]);
}

async function runDemoSeed(): Promise<void> {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    console.log('Sin DEMO_PASSWORD: no se cargan los datos de demostración');
    return;
  }
  await dataSource.initialize();
  try {
    const exists = await dataSource
      .getRepository(User)
      .existsBy({ email: FIRST_DEMO_EMAIL });
    if (exists) {
      console.log('Los datos de demostración ya existen');
      return;
    }
    await dataSource.transaction(async (manager) => {
      await seedDemo(manager, password);
    });
    console.log('Datos de demostración cargados correctamente');
  } finally {
    await dataSource.destroy();
  }
}

runDemoSeed().catch((error) => {
  console.error('Error al cargar los datos de demostración:', error);
  process.exit(1);
});
