import { User } from "src/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuidV4 } from "uuid";

@Entity()
export class Notification {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidV4()

    @Column()
    target: string[]

    @CreateDateColumn()
    createdAt: Date

    @Column()
    source: string

    @Column({nullable: true})
    link: string

    @Column('mediumtext')
    layout: string

    @Column({nullable: true})
    subject: string
}
