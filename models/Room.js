import { DataTypes, Model } from "sequelize";

export default function initRoomModel(sequelize) {
  class Room extends Model {}

  Room.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // Ensure the name is unique for each patient
      },
      roomNumber: {
        type: DataTypes.TEXT,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Room",
      tableName: "rooms",
      timestamps: true,
      paranoid: true,
    }
  );

  // Define a hook to generate the slug before creating a new patient
  Room.beforeCreate(async (room) => {
    // Generate slug by transforming the name to lowercase and removing spaces
    const slug = room.name.toLowerCase().replace(/\s+/g, "");

    // Check if a patient with the same slug already exists
    const existingRoom = await Room.findOne({ where: { slug } });
    if (existingRoom) {
      throw new Error(
        "A Room with the same name already exists. Please use a different name."
      );
    }

    room.slug = slug;
  });

  return Room;
}
