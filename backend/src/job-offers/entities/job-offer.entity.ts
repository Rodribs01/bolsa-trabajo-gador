import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { JobOfferStatus } from '../../common/enums/job-offer-status.enum.js';
import { Company } from '../../companies/entities/company.entity.js';
import { JobOfferProfession } from './job-offer-profession.entity.js';
import { JobOfferSkill } from './job-offer-skill.entity.js';

@Entity('ofertas')
export class JobOffer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'empresa_id' })
  companyId: number;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'empresa_id' })
  company: Company;

  @Column({ name: 'titulo', length: 150 })
  title: string;

  @Column({ name: 'descripcion', type: 'text' })
  description: string;

  @Column({ name: 'requisitos_obligatorios', type: 'text' })
  requiredRequirements: string;

  @Column({ name: 'requisitos_deseables', type: 'text', nullable: true })
  desiredRequirements: string | null;

  @Column({ name: 'anios_experiencia', default: 0 })
  yearsOfExperience: number;

  @Column({ name: 'tipo_contrato_id' })
  contractTypeId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'tipo_contrato_id' })
  contractType: Catalog;

  @Column({ name: 'modalidad_id' })
  modalityId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'modalidad_id' })
  modality: Catalog;

  @Column({ name: 'municipio_id' })
  municipalityId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'municipio_id' })
  municipality: Catalog;

  @Column({
    name: 'salario_min',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  minSalary: number | null;

  @Column({
    name: 'salario_max',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  maxSalary: number | null;

  @Column({ name: 'salario_a_tratar', default: false })
  salaryToNegotiate: boolean;

  @Column({ name: 'beneficios', type: 'simple-json', nullable: true })
  benefits: string[] | null;

  @Column({ name: 'fecha_cierre', type: 'date' })
  closingDate: string;

  @Column({ name: 'numero_plazas', default: 1 })
  vacancies: number;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: JobOfferStatus,
    default: JobOfferStatus.DRAFT,
  })
  status: JobOfferStatus;

  // Observación del administrador al devolver la oferta a BORRADOR
  @Column({ name: 'observacion', type: 'text', nullable: true })
  observation: string | null;

  @Column({ name: 'total_vistas', default: 0 })
  totalViews: number;

  @Column({ name: 'oferta_origen_id', type: 'int', nullable: true })
  sourceOfferId: number | null;

  @ManyToOne(() => JobOffer, { nullable: true })
  @JoinColumn({ name: 'oferta_origen_id' })
  sourceOffer: JobOffer | null;

  @Column({ name: 'publicado_en', type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @OneToMany(() => JobOfferProfession, (profession) => profession.jobOffer)
  professions: JobOfferProfession[];

  @OneToMany(() => JobOfferSkill, (offerSkill) => offerSkill.jobOffer)
  skills: JobOfferSkill[];

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt: Date;
}
