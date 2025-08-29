const { User } = require("../models");
const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/hash");

module.exports = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const exist = await User.findOne({ where: { email } });
      if (exist) return res.status(400).json({ message: "Email already used" });

      const hashed = await hashPassword(password);
      const user = await User.create({ name, email, password: hashed });

      return res.status(201).json({ message: "User registered", user });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });
      if (!user) return res.status(404).json({ message: "User not found" });

      const match = await comparePassword(password, user.password);
      if (!match) return res.status(400).json({ message: "Wrong password" });

      const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1d" });

      return res.json({ message: "Login success", token });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },
};
