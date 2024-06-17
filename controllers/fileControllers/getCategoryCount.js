const { getCategoryFromFileName } = require("../../utils/utils");
const User = require("../../models/userSchema");

const getCategoryCount = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const categories = {
      pictures: 0,
      videos: 0,
      audio: 0,
      documents: 0,
    };

    if (req.query.favorites === "true") {
      for (const file of user.files) {
        if (file.isFavorite) {
          const category = getCategoryFromFileName(file.name);
          if (category in categories) {
            categories[category]++;
          }
        }
      }
    } else {
      for (const file of user.files) {
        const category = getCategoryFromFileName(file.name);
        if (category in categories) {
          categories[category]++;
        }
      }
    }

    return res.status(200).json({ message: "Success", categories });
  } catch (error) {
    next(error);
  }
};

module.exports = getCategoryCount;
