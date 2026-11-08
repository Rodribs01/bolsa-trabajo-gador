import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Catalog } from '../../catalogs/entities/catalog.entity.js';
import { CompanyStatus } from '../../common/enums/company-status.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('empresas')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'usuario_id' })
  user: User;

  @Column({ name: 'nit', length: 20, unique: true })
  nit: string;

  @Column({ name: 'razon_social', length: 150 })
  businessName: string;

  @Column({ name: 'rubro_id' })
  sectorId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'rubro_id' })
  sector: Catalog;

  @Column({ name: 'representante_legal', length: 150 })
  legalRepresentative: string;

  @Column({ name: 'ci_representante', length: 15 })
  representativeCi: string;

  @Column({ name: 'celular', length: 20 })
  phone: string;

  @Column({ name: 'email_corporativo', length: 150 })
  corporateEmail: string;

  @Column({ name: 'direccion', length: 200 })
  address: string;

  @Column({ name: 'municipio_id' })
  municipalityId: number;

  @ManyToOne(() => Catalog)
  @JoinColumn({ name: 'municipio_id' })
  municipality: Catalog;

  @Column({ name: 'numero_trabajadores', type: 'int', nullable: true })
  employeeCount: number | null;

  @Column({ name: 'logo', type: 'varchar', length: 255, nullable: true })
  logo: string | null;

  @Column({ name: 'documento_respaldo', length: 255 })
  supportDocument: string;

  @Column({ name: 'descripcion', type: 'text' })
  description: string;

  @Column({
    name: 'estado',
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.PENDING,
  })
  status: CompanyStatus;

  @Column({ name: 'motivo_rechazo', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'validado_por', type: 'int', nullable: true })
  validatedById: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'validado_por' })
  validatedBy: User | null;

  @Column({ name: 'validado_en', type: 'datetime', nullable: true })
  validatedAt: Date | null;

  @CreateDateColumn({ name: 'creado_en' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'actualizado_en' })
  updatedAt: Date;
}
