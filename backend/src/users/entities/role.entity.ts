import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'nombre', length: 30, unique: true })
  name: string;

  @Column({ name: 'descripcion', length: 150, nullable: true })
  description: string;
}
