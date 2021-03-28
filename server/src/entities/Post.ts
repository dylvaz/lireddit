import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Field, ObjectType } from 'type-graphql';
import { User } from './User';

@ObjectType()
@Entity()
export class Post extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field()
  @Column({ type: 'text' })
  title!: string;

  @Field()
  @Column({ type: 'text' })
  text!: string;

  @Field()
  @Column({ type: 'int', default: 0 })
  points!: number;

  @ManyToOne(() => User, (user) => user.posts)
  creator: User;

  @Field()
  @Column({ type: 'int' })
  creatorId: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt!: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt!: Date;
}
