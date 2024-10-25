import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { v4 as uuidv4 } from "uuid"; 

@Entity()
export class Verification {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4()

    @Column()
    associated_email: string

    @Column('json')
    result: string

    @Column('date')
    expiresAt: Date
}