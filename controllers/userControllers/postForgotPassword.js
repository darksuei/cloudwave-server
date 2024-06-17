const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../../models/userSchema");

const postForgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const tempSecret = process.env.JWT_SECRET + user.hash;

    const tempToken = jwt.sign({ email: email }, tempSecret, {
      expiresIn: "1h",
    });

    const link = `${process.env.CLIENT_URL}/reset_password/${user._id}/${tempToken}`;

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MYEMAIL,
        pass: process.env.APP_PASS,
      },
    });

    let mailOptions = {
      from: process.env.MYEMAIL,
      to: email,
      subject: "Cloud wave password reset",
      text: `Follow the link to reset your password ${link}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.error(error);
        return res.status(400).json({ message: "Email not sent" });
      } else {
        return res.status(200).json({ message: "Email sent" });
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = postForgotPassword;
