const Reminder = require("../models/eventReminders");
const db = require("../config/config");

const setReminder = async (req, res) => {
  const transaction = await db.transaction();
  const { deviceId, eventId, eventTitle, reminderDate, reminderData } =
    req.body;

  if (!deviceId || !eventId || !eventTitle || !reminderDate) {
    return res.status(400).json({
      message: "Missing fields",
    });
  }

  try {
    const reminderDateTime = new Date(reminderDate);
    if (isNaN(reminderDateTime.getTime())) {
      return res.status(400).json({
        error: "Invalid reminderDate format",
      });
    }

    const existingReminder = await Reminder.findOne({
      where: {
        deviceId,
        eventId,
        isActive: true,
      },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (existingReminder) {
      await existingReminder.update(
        {
          eventTitle,
          reminderDate: reminderDateTime,
          reminderData: reminderData || {},
        },
        { transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        message: "Reminder updated successfully",
        reminder: existingReminder,
      });
    }

    const reminder = await Reminder.create(
      {
        deviceId,
        eventId,
        eventTitle,
        reminderDate: reminderDateTime,
        reminderData: reminderData || {},
      },
      { transaction }
    );

    await transaction.commit();

    return res.status(201).json({
      message: "Reminder set successfully",
      reminder,
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      message: "Failed to set reminder",
    });
  }
};

const getReminders = async (req, res) => {
  const { deviceId } = req.params;
  const { activeOnly = "true" } = req.query;

  if (!deviceId) {
    return res.status(400).json({
      message: "Device ID is required",
    });
  }

  try {
    const whereClause = { deviceId };

    if (activeOnly === "true") {
      whereClause.isActive = true;
    }

    const reminders = await Reminder.findAll({
      where: whereClause,
      order: [["reminderDate", "ASC"]],
    });

    return res.status(200).json({
      count: reminders.length,
      reminders,
    });
  } catch (error) {
    console.log("all reminders", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

const updateReminder = async (req, res) => {
  const transaction = await db.transaction();
  const { id } = req.params;
  const { eventTitle, reminderDate, isActive, reminderData } = req.body;

  try {
    const reminder = await Reminder.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!reminder) {
      return res.status(404).json({
        error: "Reminder not found",
      });
    }

    const updateData = {};
    if (eventTitle !== undefined) updateData.eventTitle = eventTitle;
    if (reminderDate !== undefined)
      updateData.reminderDate = new Date(reminderDate);
    if (isActive !== undefined) updateData.isActive = isActive;
    if (reminderData !== undefined) updateData.reminderData = reminderData;

    await reminder.update(updateData, { transaction });

    await transaction.commit();

    return res.status(200).json({
      message: "Reminder updated successfully",
      reminder,
    });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({
      message: err.message,
    });
  }
};

const deleteReminder = async (req, res) => {
  const { id } = req.params;
  const transaction = await db.transaction();

  try {
    const reminder = await Reminder.findByPk(id, { transaction });

    if (!reminder) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Reminder not found",
      });
    }

    await reminder.destroy();
    await transaction.commit();

    return res.status(200).json({
      message: "Reminder deleted successfully",
    });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({
      message: err.message,
    });
  }
};

const deactivateReminder = async (req, res) => {
  const { id } = req.params;
  const transaction = await db.transaction();

  try {
    const reminder = await Reminder.findByPk(id, { transaction });

    if (!reminder) {
      await transaction.rollback();
      return res.status(404).json({
        message: "Reminder not found",
      });
    }

    await reminder.update({ isActive: false }, { transaction });

    await transaction.commit();

    return res.status(200).json({
      message: "Reminder deactivated successfully",
    });
  } catch (err) {
    await transaction.rollback();
    return res.status(500).json({
      message: err.message,
    });
  }
};

const getUpcomingReminders = async (req, res) => {
  const { minutes = 60 } = req.query;

  try {
    const now = new Date();
    const futureDate = new Date(now.getTime() + minutes * 60000);

    const reminders = await Reminder.findAll({
      where: {
        isActive: true,
        notificationSent: false,
        reminderDate: {
          [Op.between]: [now, futureDate],
        },
      },
      order: [["reminderDate", "ASC"]],
    });

    return res.status(200).json({
      count: reminders.length,
      reminders: reminders.map((reminder) => reminder.toJSON()),
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

module.exports = {
  setReminder,
  getReminders,
  updateReminder,
  deleteReminder,
  deactivateReminder,
  getUpcomingReminders,
};
