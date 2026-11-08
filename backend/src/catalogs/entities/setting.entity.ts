import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('configuraciones')
export class Setting {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'clave', length: 60, unique: true })
  key: string;

  @Column({ name: 'valor', length: 255 })
  value: string;

  @Column({ name: 'descripcion', length: 200, nullable: true })
  description: string;
}
