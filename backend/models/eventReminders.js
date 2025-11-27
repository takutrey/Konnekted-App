const { DataTypes, UUIDV4 } = require("sequelize");
const db = require("../config/config");

const Reminder = db.define(
  "reminders",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "events",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    eventTitle: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reminderDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    notificationSent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reminderData: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: "reminders",
    indexes: [
      {
        fields: ["deviceId"],
      },
      {
        fields: ["eventId"],
      },
      {
        fields: ["reminderDate"],
      },
      {
        fields: ["deviceId", "isActive"],
      },
    ],
  }
);

module.exports = Reminder;
