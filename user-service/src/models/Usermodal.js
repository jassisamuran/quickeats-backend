import { EntitySchema } from "typeorm";

export const UserRole = {
  CUSTOMER: "customer",
  RESTAURANT_OWNER: "restaurant_owner",
  DELIVERY_BOY: "delivery_boy",
  ADMIN: "admin",
};

const User = new EntitySchema({
  name: "User",
  tableName: "users",

  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },

    email: {
      type: String,
      unique: true,
    },

    password: {
      type: String,
      select: false,
    },

    phone: {
      type: String,
      unique: true,
    },

    role: {
      type: "enum",
      enum: UserRole,
      default: UserRole.CUSTOMER,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      nullable: true,
    },

    preferences: {
      type: "json",
      nullable: true,
    },

    refreshToken: {
      type: String,
      nullable: true,
      select: false,
    },

    lastLoginAt: {
      type: "timestamp",
      nullable: true,
    },

    createdAt: {
      type: "timestamp",
      createDate: true,
    },

    updatedAt: {
      type: "timestamp",
      updateDate: true,
    },
  },

  relations: {
    addresses: {
      type: "one-to-many",
      target: "Address",
      inverseSide: "user",
      cascade: true,
    },
  },
});

export default User;
