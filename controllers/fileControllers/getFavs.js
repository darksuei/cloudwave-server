const { formatDateLabel } = require("../../utils/utils");
const User = require("../../models/userSchema");

const getFavs = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const favs = user.files.filter((file) => file.isFavorite);

    if (!favs) return res.status(404).json({ message: "No favorites found" });

    favs.map((item) => {
      item.time = formatDateLabel(item.date);
      return item;
    });

    return res.status(200).json({ message: "Success", favs: favs });
  } catch (error) {
    next(error);
  }
};

module.exports = getFavs;
