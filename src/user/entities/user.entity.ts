import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { v4 as uuidv4 } from 'uuid'

@Entity()
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string = uuidv4()

    @Column()
    full_name: string

    @Column({nullable: true})
    user_name: string

    @Column()
    password: string

    @Column({nullable: true})
    profession: string

    @Column()
    email_address: string

    @Column({default: false})
    verified: boolean

    @Column({nullable: true})
    profile_photo: string
}
