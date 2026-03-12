import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import createAuditLog from "../middleware/createAuditLog.js"

// REGISTER USER
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed ,role:role || "user"});
    res.status(201).json({ msg: "User registered successfully", newUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  
};

// LOGIN USER
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
   // res.json({ token, user });

createAuditLog({
  action: "USER_LOGGED_IN",
  entity: "User",
  user,
  details: { email: user.email }
});


   res.json({ 
  token, 
  role: user.role,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  }
});

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "User not found" });

  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
  user.resetToken = resetToken;
  user.resetTokenExpire = Date.now() + 15 * 60 * 1000;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await transporter.sendMail({
    to: user.email,
    subject: "Password Reset",
    html: `<p>Click here to reset password: <a href="${resetLink}">${resetLink}</a></p>`,
  });

  res.json({ msg: "Password reset link sent to email" });
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(400).json({ msg: "Invalid token" });

    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ msg: "Password reset successful" });
  } catch (err) {
    res.status(400).json({ msg: "Invalid or expired token" });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // coming from protect middleware
    const { name, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email },
      { new: true }
    );

    res.json({
      msg: "Profile updated successfully",
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ msg: "Server error", error: error.message });
  }
};



