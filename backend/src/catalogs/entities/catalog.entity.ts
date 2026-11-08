import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CatalogType } from '../../common/enums/catalog-type.enum.js';

@Entity('catalogos')
export class Catalog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ name: 'tipo', type: 'enum', enum: CatalogType })
  type: CatalogType;

  @Column({ name: 'nombre', length: 100 })
  name: string;

  // Un municipio apunta a su departamento
  @Column({ name: 'padre_id', type: 'int', nullable: true })
  parentId: number | null;

  @ManyToOne(() => Catalog, { nullable: true })
  @JoinColumn({ name: 'padre_id' })
  parent: Catalog | null;

  @Column({ name: 'orden', default: 0 })
  order: number;

  @Column({ name: 'activo', default: true })
  active: boolean;
}
