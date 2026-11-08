import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('habilidades')
export class Skill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', length: 80, unique: true })
  name: string;

  @Column({ name: 'categoria', type: 'varchar', length: 60, nullable: true })
  category: string | null;

  @Column({ name: 'activo', default: true })
  active: boolean;
}
