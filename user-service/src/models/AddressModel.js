import { EntitySchema } from "typeorm";

export const AddressType = {
  HOME: "home",
  WORK: "work",
  OTHER: "other",
};

const Address = new EntitySchema({
  name: "Address",
  tableName: "addresses",

  columns: {
    id: {
      type: "uuid",
      primary: true,
      generated: "uuid",
    },

    userId: {
      type: "uuid",
    },

    type: {
      type: "enum",
      enum: AddressType,
      default: AddressType.HOME,
    },

    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },
    country: { type: String },

    landmark: {
      type: String,
      nullable: true,
    },

    latitude: {
      type: "decimal",
      precision: 10,
      scale: 8,
    },

    longitude: {
      type: "decimal",
      precision: 11,
      scale: 8,
    },

    isDefault: {
      type: Boolean,
      default: false,
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
    user: {
      type: "many-to-one",
      target: "User",
      joinColumn: { name: "userId" },
      onDelete: "CASCADE",
    },
  },
});

export default Address;
