const User = require("../../models/userSchema");

const getStorage = async (req, res) => {
  const maxStorage = 3;
  const maxStorageKB = maxStorage * 1024 * 1024;

  const user = await User.findOne({ email: req.user.email });

  if (!user) return res.status(404).json({ message: "User not found" });

  const storageUsedKB = Math.round(user.spaceUsed);
  const storageUsedMB = Math.round(storageUsedKB / 1024);
  const storageUsedGB = Math.round(storageUsedKB / (1024 * 1024));
  let percentage = Math.round((storageUsedKB / maxStorageKB) * 100);

  if (storageUsedKB > 0 && storageUsedKB < 52429) percentage = 1;

  if (storageUsedKB > 1024 * 1024) {
    return res.status(200).json({
      message: "Success",
      storageUsed: storageUsedGB,
      unit: "GB",
      percentage,
    });
  } else if (storageUsedKB > 1024) {
    return res.status(200).json({
      message: "Success",
      storageUsed: storageUsedMB,
      unit: "MB",
      percentage,
    });
  }
  return res.status(200).json({
    message: "Success",
    storageUsed: storageUsedKB,
    unit: "KB",
    percentage,
  });
};

module.exports = getStorage;
