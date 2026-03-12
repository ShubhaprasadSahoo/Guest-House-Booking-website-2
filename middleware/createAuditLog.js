import AuditLog from "../models/AuditLog.js";

const createAuditLog = async ({ action, entity, user, details }) => {
  try {
    await AuditLog.create({
      action,
      entity,
      performedBy: {
        id: user?._id,
        name: user?.name,
        role: user?.role
      },
      details
    });
  } catch (err) {
    console.log("Audit Log Error:", err.message);
  }
};

 export default createAuditLog;