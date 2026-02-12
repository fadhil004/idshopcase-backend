const { User, Address, JntAddressMapping } = require("../models");

const { hashPassword, comparePassword } = require("../utils/hash");
const fs = require("fs");
const path = require("path");
const redis = require("../config/redis");

module.exports = {
  createUserByAdmin: async (req, res) => {
    try {
      const { name, email, phone, password, role } = req.body;

      const existEmail = await User.findOne({ where: { email } });
      if (existEmail) {
        return res.status(400).json({ message: "Email already used" });
      }

      const existPhone = await User.findOne({ where: { phone } });
      if (existPhone) {
        return res.status(400).json({ message: "Phone already used" });
      }

      const hashedPassword = await hashPassword(password);

      const user = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: role || "customer",
      });

      const {
        password: _,
        resetPasswordToken,
        resetPasswordExpire,
        ...data
      } = user.toJSON();

      await redis.del("users:all");
      await redis.del(`user:${user.id}`);

      return res.status(201).json({
        message: "User successfully created by admin",
        user: data,
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  },

  getProfile: async (req, res) => {
    try {
      const cacheKey = `user:profile:${req.user.id}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const user = await User.findByPk(req.user.id, {
        attributes: ["id", "name", "email", "phone", "profile_picture", "role"],
        include: [{ model: Address, as: "Addresses" }],
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      await redis.setex(cacheKey, 120, JSON.stringify(user));

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

      await redis.del(`user:profile:${req.user.id}`);
      await redis.del(`user:${req.user.id}`);

      return res.json({
        message: "Profile updated",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profile_picture: user.profile_picture,
          role: user.role,
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

      await redis.del(`user:profile:${req.user.id}`);
      await redis.del(`user:${req.user.id}`);

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
        postal_code,
        details,
        is_primary,
      } = req.body;

      // hitung jumlah address user
      const addressCount = await Address.count({
        where: { userId: req.user.id },
      });

      let finalIsPrimary = false;

      if (addressCount === 0) {
        finalIsPrimary = true;
      } else if (is_primary === true) {
        await Address.update(
          { is_primary: false },
          { where: { userId: req.user.id } },
        );
        finalIsPrimary = true;
      }

      const mapping = await JntAddressMapping.findOne({
        where: { province, city, district },
      });

      if (!mapping) {
        return res.status(400).json({
          message: "Alamat tidak valid atau belum terdaftar di J&T mapping",
        });
      }

      const newAddress = await Address.create({
        userId: req.user.id,
        recipient_name,
        phone,
        province,
        city,
        district,
        postal_code,
        details,
        is_primary: finalIsPrimary,
        jntAddressMappingId: mapping.id,
      });

      await redis.del(`user:addresses:${req.user.id}`);
      await redis.del(`user:profile:${req.user.id}`);

      return res.status(201).json({
        message: "Address added",
        newAddress,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAddresses: async (req, res) => {
    try {
      const cacheKey = `user:addresses:${req.user.id}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ addresses: JSON.parse(cached) });
      }

      const addresses = await Address.findAll({
        where: { userId: req.user.id },
        attributes: [
          "id",
          "recipient_name",
          "phone",
          "province",
          "city",
          "district",
          "postal_code",
          "details",
          "is_primary",
        ],
      });

      if (!addresses.length)
        return res.status(404).json({ message: "No addresses found" });

      await redis.setex(cacheKey, 120, JSON.stringify(addresses));

      return res.json({ addresses });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  getAddressById: async (req, res) => {
    try {
      const { id } = req.params;
      const cacheKey = `user:address:${req.user.id}:${id}`;

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ address: JSON.parse(cached) });
      }

      const address = await Address.findOne({
        where: { id, userId: req.user.id },
        attributes: [
          "id",
          "recipient_name",
          "phone",
          "province",
          "city",
          "district",
          "postal_code",
          "details",
          "is_primary",
        ],
      });

      if (!address)
        return res.status(404).json({ message: "Address not found" });

      await redis.setex(cacheKey, 120, JSON.stringify(address));

      return res.json({ address });
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
        postal_code,
        details,
        is_primary,
      } = req.body;

      const addr = await Address.findOne({
        where: { id, userId: req.user.id },
      });
      if (!addr) return res.status(404).json({ message: "Address not found" });

      let mapping = null;
      if (province || city || district) {
        const newProvince = province || addr.province;
        const newCity = city || addr.city;
        const newDistrict = district || addr.district;

        mapping = await JntAddressMapping.findOne({
          where: {
            province: newProvince,
            city: newCity,
            district: newDistrict,
          },
        });

        if (!mapping) {
          return res.status(400).json({
            message:
              "Alamat tidak valid atau belum terdaftar di J&T mapping. Pastikan provinsi, kota, dan kecamatan sesuai.",
          });
        }

        addr.jntAddressMappingId = mapping.id;
      }

      if (is_primary === true) {
        // kalau alamat ini SUDAH primary, tidak perlu reset
        if (!addr.is_primary) {
          await Address.update(
            { is_primary: false },
            { where: { userId: req.user.id } },
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
      addr.postal_code = postal_code || addr.postal_code;
      addr.details = details || addr.details;
      if (is_primary === true && !addr.is_primary) {
        await Address.update(
          { is_primary: false },
          { where: { userId: req.user.id } },
        );
        addr.is_primary = true;
      } else if (is_primary === false) {
        addr.is_primary = false;
      }

      await addr.save();

      await redis.del(`user:addresses:${req.user.id}`);
      await redis.del(`user:address:${req.user.id}:${id}`);
      await redis.del(`user:profile:${req.user.id}`);

      return res.json({
        message: "Address updated",
        addr,
        mapping: mapping ? mapping : "Mapping unchanged",
      });
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

      await redis.del(`user:addresses:${req.user.id}`);
      await redis.del(`user:address:${req.user.id}:${id}`);
      await redis.del(`user:profile:${req.user.id}`);

      return res.json({ message: "Address deleted" });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  //Admin Panel
  getAllUsers: async (req, res) => {
    try {
      const cacheKey = "users:all";

      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json(JSON.parse(cached));
      }

      const users = await User.findAll({
        attributes: ["id", "name", "email", "phone", "role", "profile_picture"],
      });

      await redis.setex(cacheKey, 60, JSON.stringify(users));

      res.json(users);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const id = req.params.id;
      const cacheKey = `user:${id}`;

      const cached = await redis.get(cacheKey);
      if (cached) return res.json(JSON.parse(cached));

      const user = await User.findByPk(id, {
        attributes: ["id", "name", "email", "phone", "role", "profile_picture"],
      });

      if (!user) return res.status(404).json({ message: "User not found" });

      await redis.setex(cacheKey, 120, JSON.stringify(user));

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
      await redis.del("users:all");
      await redis.del(`user:${req.params.id}`);

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
      await redis.del("users:all");
      await redis.del(`user:${req.params.id}`);

      res.json({ message: "User deleted" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
