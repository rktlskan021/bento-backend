import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({name:'security', schema:'webapi_security'})
export class User{
    @PrimaryGeneratedColumn()
    email: string;

    @Column()
    password: string;
}