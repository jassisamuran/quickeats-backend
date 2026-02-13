import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

const AddressType = {
  HOME: "home",
  WORK: "work",
  OTHER: "other",
};

@Entity("addresses")
export class Address {
  @PrimaryGeneratedColumn("uuid")
  id;

  @Column("uuid")
  userId;

  @ManyToMany(() => User, user.addresses, { onDelete: "CASCADE" })
  user;

  @Column({ type: "enum", enum: AddressType, default: AddressType.HOME })
  type;

  @Column
  street;

  @Column
  city;

  @Column
  state;

  @Column
  pincode;

  @Column
  country;

  @Column({ nullable: true })
  landmark;

  @Column({ type: "decimal", precision: 10, scale: 8 })
  latitude;

  @Column({ type: "decimal", precision: 11, scale: 8 })
  longitude;

  @Column({ default: false })
  isDefault;

  @CreateDateColumn
  CreateDateColumn;

  @UpdateDateColumn()
  updatedAt;
}
