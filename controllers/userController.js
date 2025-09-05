const { User, Address } = require("../models");
const { hashPassword, comparePassword } = require("../utils/hash");
const fs = require("fs");
const path = require("path");

module.exports = {
  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ["id", "name", "email", "phone", "profile_picture"],
        include: [{ model: Address, as: "Addresses" }],
      });

      if (!user) return res.status(404).json({ message: "User not found" });
      return res.json(user);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  updateProfile: async (req, res) => {
    try {
      const { name, phone } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      user.name = name || user.name;
      user.phone = phone || user.phone;

      // Jika ada file baru
      if (req.file) {
        // Hapus file lama kalau ada
        if (user.profile_picture) {
          const oldPath = path.join(__dirname, "..", user.profile_picture);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }

        // Simpan path baru
        user.profile_picture = `/uploads/profile_pictures/${req.file.filename}`;
      }

      await user.save();

      return res.json({
        message: "Profile updated",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profile_picture: user.profile_picture,
        },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  updatePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      const match = await comparePassword(oldPassword, user.password);
      if (!match)
        return res.status(400).json({ message: "Wrong old password" });

      user.password = await hashPassword(newPassword);
      await user.save();

      return res.json({ message: "Password updated" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  addAddress: async (req, res) => {
    try {
      const {
        recipient_name,
        phone,
        province,
        city,
        district,
        sub_district,
        postal_code,
        details,
        is_primary,
      } = req.body;

      // kalau set primary, reset primary sebelumnya
      if (is_primary) {
        await Address.update(
          { is_primary: false },
          { where: { userId: req.user.id } }
        );
      }

      const newAddress = await Address.create({
        userId: req.user.id,
        recipient_name,
        phone,
        province,
        city,
        district,
        sub_district,
        postal_code,
        details,
        is_primary: !!is_primary,
      });

      return res.status(201).json({ message: "Address added", newAddress });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  updateAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        recipient_name,
        phone,
        province,
        city,
        district,
        sub_district,
        postal_code,
        details,
        is_primary,
      } = req.body;

      const addr = await Address.findOne({
        where: { id, userId: req.user.id },
      });
      if (!addr) return res.status(404).json({ message: "Address not found" });

      if (is_primary === true) {
        // kalau alamat ini SUDAH primary, tidak perlu reset
        if (!addr.is_primary) {
          await Address.update(
            { is_primary: false },
            { where: { userId: req.user.id } }
          );
          addr.is_primary = true;
        }
      } else if (is_primary === false) {
        addr.is_primary = false;
      }

      addr.recipient_name = recipient_name || addr.recipient_name;
      addr.phone = phone || addr.phone;
      addr.province = province || addr.province;
      addr.city = city || addr.city;
      addr.district = district || addr.district;
      addr.sub_district = sub_district || addr.sub_district;
      addr.postal_code = postal_code || addr.postal_code;
      addr.details = details || addr.details;
      addr.is_primary = is_primary !== undefined ? is_primary : addr.is_primary;

      await addr.save();

      return res.json({ message: "Address updated", addr });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  deleteAddress: async (req, res) => {
    try {
      const { id } = req.params;
      const addr = await Address.findOne({
        where: { id, userId: req.user.id },
      });

      if (!addr) return res.status(404).json({ message: "Address not found" });

      const isPrimary = addr.is_primary;

      // Hapus address
      await addr.destroy();

      // Kalau address yang dihapus itu primary
      if (isPrimary) {
        // Cari address lain milik user dengan id paling kecil
        const newPrimary = await Address.findOne({
          where: { userId: req.user.id },
          order: [["id", "ASC"]],
        });

        if (newPrimary) {
          newPrimary.is_primary = true;
          await newPrimary.save();
        }
      }

      return res.json({ message: "Address deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  //Admin Panel
  getAllUsers: async (req, res) => {
    try {
      const users = await User.findAll({
        attributes: ["id", "name", "email", "phone", "role", "profile_picture"],
      });
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: ["id", "name", "email", "phone", "role", "profile_picture"],
      });
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateUserByAdmin: async (req, res) => {
    try {
      const { name, email, phone, role } = req.body;
      const user = await User.findByPk(req.params.id);

      if (!user) return res.status(404).json({ message: "User not found" });

      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.role = role || user.role;

      await user.save();
      res.json({ message: "User updated by admin", user });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.profile_picture) {
        const oldPath = path.join(__dirname, "..", user.profile_picture);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      await user.destroy();
      res.json({ message: "User deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};