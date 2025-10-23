jest.mock("../../models", () => require("../../mocks/models"));
jest.mock("fs");
jest.mock("path");
jest.mock("../../utils/hash");

const { User, Address } = require("../../models");
const { hashPassword, comparePassword } = require("../../utils/hash");
const fs = require("fs");

const userController = require("../../controllers/userController");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

console.log("Mock User keys:", Object.keys(User));

describe("UserController", () => {
  const mockUser = {
    id: 1,
    name: "Test User",
    email: "test@mail.com",
    phone: "08123",
    role: "user",
    password: "hashedpass",
    profile_picture: "/uploads/old.jpg",
    save: jest.fn(),
    destroy: jest.fn(),
  };

  const mockAddress = {
    id: 1,
    userId: 1,
    is_primary: true,
    recipient_name: "A",
    save: jest.fn(),
    destroy: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === getProfile ===
  it("should return user profile", async () => {
    User.findByPk.mockResolvedValue(mockUser);
    const req = { user: { id: 1 } };
    const res = mockRes();
    await userController.getProfile(req, res);
    expect(res.json).toHaveBeenCalledWith(mockUser);
  });

  it("should return 404 if user not found in getProfile", async () => {
    User.findByPk.mockResolvedValue(null);
    const req = { user: { id: 1 } };
    const res = mockRes();
    await userController.getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  // === updateProfile ===
  it("should update profile without file", async () => {
    User.findByPk.mockResolvedValue({ ...mockUser, save: jest.fn() });
    const req = { user: { id: 1 }, body: { name: "New" } };
    const res = mockRes();
    await userController.updateProfile(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Profile updated" })
    );
  });

  it("should update profile with new picture and remove old", async () => {
    fs.existsSync.mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});
    User.findByPk.mockResolvedValue({ ...mockUser, save: jest.fn() });
    const req = {
      user: { id: 1 },
      body: {},
      file: { filename: "newpic.jpg" },
    };
    const res = mockRes();
    await userController.updateProfile(req, res);
    expect(unlinkSpy).toHaveBeenCalled();
  });

  it("should handle updateProfile error", async () => {
    User.findByPk.mockRejectedValue(new Error("DB Error"));
    const req = { user: { id: 1 }, body: {} };
    const res = mockRes();
    await userController.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  // === updatePassword ===
  it("should update password successfully", async () => {
    User.findByPk.mockResolvedValue({ ...mockUser, save: jest.fn() });
    comparePassword.mockResolvedValue(true);
    hashPassword.mockResolvedValue("hashedNew");
    const req = {
      user: { id: 1 },
      body: { oldPassword: "a", newPassword: "b" },
    };
    const res = mockRes();
    await userController.updatePassword(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: "Password updated" });
  });

  it("should return 400 if old password wrong", async () => {
    User.findByPk.mockResolvedValue(mockUser);
    comparePassword.mockResolvedValue(false);
    const req = {
      user: { id: 1 },
      body: { oldPassword: "x", newPassword: "y" },
    };
    const res = mockRes();
    await userController.updatePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  // === addAddress ===
  it("should add address and reset primary if needed", async () => {
    Address.update.mockResolvedValue();
    Address.create.mockResolvedValue(mockAddress);
    const req = { user: { id: 1 }, body: { is_primary: true } };
    const res = mockRes();
    await userController.addAddress(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  // === getAddresses ===
  it("should return all addresses", async () => {
    Address.findAll.mockResolvedValue([mockAddress]);
    const req = { user: { id: 1 } };
    const res = mockRes();
    await userController.getAddresses(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should return 404 if no address found", async () => {
    Address.findAll.mockResolvedValue([]);
    const req = { user: { id: 1 } };
    const res = mockRes();
    await userController.getAddresses(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  // === updateAddress ===
  it("should update existing address and set new primary", async () => {
    Address.findOne.mockResolvedValue({ ...mockAddress, save: jest.fn() });
    Address.update.mockResolvedValue();
    const req = {
      user: { id: 1 },
      params: { id: 1 },
      body: { is_primary: true },
    };
    const res = mockRes();
    await userController.updateAddress(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Address updated" })
    );
  });

  it("should return 404 if address not found", async () => {
    Address.findOne.mockResolvedValue(null);
    const req = { user: { id: 1 }, params: { id: 1 }, body: {} };
    const res = mockRes();
    await userController.updateAddress(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  // === deleteAddress ===
  it("should delete address and set new primary", async () => {
    Address.findOne.mockResolvedValueOnce(mockAddress).mockResolvedValueOnce({
      ...mockAddress,
      is_primary: false,
      save: jest.fn(),
    });
    const req = { user: { id: 1 }, params: { id: 1 } };
    const res = mockRes();
    await userController.deleteAddress(req, res);
    expect(res.json).toHaveBeenCalledWith({ message: "Address deleted" });
  });

  // === Admin ===
  it("should get all users", async () => {
    User.findAll.mockResolvedValue([mockUser]);
    const res = mockRes();
    await userController.getAllUsers({}, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should get user by id", async () => {
    User.findByPk.mockResolvedValue(mockUser);
    const req = { params: { id: 1 } };
    const res = mockRes();
    await userController.getUserById(req, res);
    expect(res.json).toHaveBeenCalled();
  });

  it("should handle not found in getUserById", async () => {
    User.findByPk.mockResolvedValue(null);
    const req = { params: { id: 1 } };
    const res = mockRes();
    await userController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should update user by admin", async () => {
    User.findByPk.mockResolvedValue({ ...mockUser, save: jest.fn() });
    const req = { params: { id: 1 }, body: { name: "new" } };
    const res = mockRes();
    await userController.updateUserByAdmin(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User updated by admin" })
    );
  });

  it("should delete user with picture", async () => {
    fs.existsSync.mockReturnValue(true);
    const unlinkSpy = jest.spyOn(fs, "unlinkSync").mockImplementation(() => {});
    User.findByPk.mockResolvedValue({ ...mockUser, destroy: jest.fn() });
    const req = { params: { id: 1 } };
    const res = mockRes();
    await userController.deleteUser(req, res);
    expect(unlinkSpy).toHaveBeenCalled();
  });

  it("should return 404 when deleting non-existent user", async () => {
    User.findByPk.mockResolvedValue(null);
    const req = { params: { id: 1 } };
    const res = mockRes();
    await userController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
  // === Error Handling Coverage ===
  it("should handle error in getProfile", async () => {
    User.findByPk.mockRejectedValue(new Error("DB fail"));
    const req = { user: { id: 1 } };
    const res = mockRes();
    await userController.getProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should return 404 if user not found in updateProfile", async () => {
    User.findByPk.mockResolvedValue(null);
    const req = { user: { id: 1 }, body: {} };
    const res = mockRes();
    await userController.updateProfile(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("should handle error in addAddress", async () => {
    Address.create.mockRejectedValue(new Error("Add error"));
    const req = { user: { id: 1 }, body: {} };
    const res = mockRes();
    await userController.addAddress(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in getAddresses", async () => {
    Address.findAll.mockRejectedValue(new Error("DB crash"));
    const req = { user: { id: 1 } };
    const res = mockRes();
    await userController.getAddresses(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in updateAddress", async () => {
    Address.findOne.mockRejectedValue(new Error("DB fail"));
    const req = { user: { id: 1 }, params: { id: 1 }, body: {} };
    const res = mockRes();
    await userController.updateAddress(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in deleteAddress", async () => {
    Address.findOne.mockRejectedValue(new Error("DB fail"));
    const req = { user: { id: 1 }, params: { id: 1 } };
    const res = mockRes();
    await userController.deleteAddress(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in getAllUsers", async () => {
    User.findAll.mockRejectedValue(new Error("DB fail"));
    const res = mockRes();
    await userController.getAllUsers({}, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in getUserById", async () => {
    User.findByPk.mockRejectedValue(new Error("DB fail"));
    const req = { params: { id: 1 } };
    const res = mockRes();
    await userController.getUserById(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in updateUserByAdmin", async () => {
    User.findByPk.mockRejectedValue(new Error("DB fail"));
    const req = { params: { id: 1 }, body: {} };
    const res = mockRes();
    await userController.updateUserByAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("should handle error in deleteUser", async () => {
    User.findByPk.mockRejectedValue(new Error("DB fail"));
    const req = { params: { id: 1 } };
    const res = mockRes();
    await userController.deleteUser(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
  // === Tambahan untuk cover else-if (is_primary === false) ===
  it("should update address and set is_primary to false", async () => {
    Address.findOne.mockResolvedValue({
      ...mockAddress,
      is_primary: true,
      save: jest.fn(),
    });
    const req = {
      user: { id: 1 },
      params: { id: 1 },
      body: { is_primary: false, city: "Bandung" },
    };
    const res = mockRes();
    await userController.updateAddress(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Address updated" })
    );
  });
  it("should return 404 if user not found in updatePassword", async () => {
    const req = {
      user: { id: 999 },
      body: { old_password: "abc", new_password: "def" },
    };
    const res = mockRes();
    jest.spyOn(User, "findByPk").mockResolvedValue(null);
    await userController.updatePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });
  it("should handle unexpected error in updatePassword", async () => {
    const req = {
      user: { id: 1 },
      body: { old_password: "abc", new_password: "def" },
    };
    const res = mockRes();
    jest.spyOn(User, "findByPk").mockImplementation(() => {
      throw new Error("Unexpected failure");
    });
    await userController.updatePassword(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Unexpected failure" });
  });
  it("should set address to primary if requested true and not currently primary", async () => {
    Address.findOne.mockResolvedValue({
      ...mockAddress,
      is_primary: false,
      save: jest.fn(),
    });
    jest.spyOn(Address, "update").mockResolvedValue([1]);
    const req = {
      user: { id: 1 },
      params: { id: 1 },
      body: { is_primary: true },
    };
    const res = mockRes();
    await userController.updateAddress(req, res);
    expect(Address.update).toHaveBeenCalledWith(
      { is_primary: false },
      { where: { userId: req.user.id } }
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Address updated" })
    );
  });
  it("should return 404 if address not found in deleteAddress", async () => {
    Address.findOne.mockResolvedValue(null);
    const req = { user: { id: 1 }, params: { id: 99 } };
    const res = mockRes();
    await userController.deleteAddress(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "Address not found" });
  });
  it("should return 404 if user not found in updateUserByAdmin", async () => {
    const req = { params: { id: 999 }, body: {} };
    const res = mockRes();
    jest.spyOn(User, "findByPk").mockResolvedValue(null);
    await userController.updateUserByAdmin(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: "User not found" });
  });

  // === Cover: addr.is_primary assignment default ===
  it("should keep is_primary unchanged if undefined in body", async () => {
    const addr = { ...mockAddress, is_primary: true, save: jest.fn() };
    Address.findOne.mockResolvedValue(addr);

    const req = {
      user: { id: 1 },
      params: { id: 1 },
      body: { city: "Medan" }, // no is_primary
    };
    const res = mockRes();

    await userController.updateAddress(req, res);
    expect(addr.is_primary).toBe(true);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Address updated" })
    );
  });

  // === Cover: deleteAddress - primary true & new primary found ===
  it("should reassign new primary if deleted address was primary", async () => {
    const addr = { id: 1, is_primary: true, destroy: jest.fn() };
    const newAddr = { id: 2, is_primary: false, save: jest.fn() };

    Address.findOne
      .mockResolvedValueOnce(addr) // first findOne (for delete)
      .mockResolvedValueOnce(newAddr); // second findOne (for newPrimary)

    const req = { user: { id: 1 }, params: { id: 1 } };
    const res = mockRes();

    await userController.deleteAddress(req, res);
    expect(newAddr.is_primary).toBe(true);
    expect(newAddr.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Address deleted" })
    );
  });

  // === Cover: updateUserByAdmin (user.name = name || user.name) ===
  it("should keep old user.name if no new name provided", async () => {
    const user = {
      id: 1,
      name: "OldName",
      email: "a@mail.com",
      phone: "08123",
      role: "user",
      save: jest.fn(),
    };
    jest.spyOn(User, "findByPk").mockResolvedValue(user);

    const req = { params: { id: 1 }, body: { email: "new@mail.com" } };
    const res = mockRes();

    await userController.updateUserByAdmin(req, res);
    expect(user.name).toBe("OldName");
    expect(user.email).toBe("new@mail.com");
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User updated by admin" })
    );
  });
});
