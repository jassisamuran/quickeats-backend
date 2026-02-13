const {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
} = require("typeorm");
const bcrypt = require("bcryptjs");
const UserRole = {
  CUSTOMER: "customer",
  RESTAURANT_OWNER: "restaurant_owner",
  DELIVERY_BOY: "delivery_boy",
  ADMIN: "admin",
};

Entity("users");
class User {
  @PrimaryGeneratedColumn("uuid")
  id;

  @Column({ unique: true })
  email;

  @Column({ select: false })
  password;

  @Column({ unique: true })
  phone;

  @Column({ type: "enum", enum: UserRole, default: UserRole.CUSTOMER })
  role;

  @Column({ default: true })
  isActive;

  @Column({ default: true })
  isEmailVerified;

  @Column({ default: false })
  isPhoneVerified;

  @Column({ nullable: true })
  profileImage;

  @Column({ type: "jsonb", nullable: true })
  preferences;

  @Column({ nullable: true, select: false })
  refreshToken;
  kll;
  @Column({ type: "timestamp", nullable: true })
  lastLoginAt;

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  address;

  @CreateDateColumn()
  createdAt;

  @UpdateDateColumn()
  updatedAt;

  @BeforeInsert
  @BeforeUpdate
  async hashPassword() {
    if (this.password && !this.password.startsWith("$2")) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  toJSON() {
    const { password, refreshToken, ...user } = this;
    return user;
  }
}
export default User;
