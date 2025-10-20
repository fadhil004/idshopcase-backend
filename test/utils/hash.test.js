const bcrypt = require("bcryptjs");
const { hashPassword, comparePassword } = require("../../utils/hash");

jest.mock("bcryptjs");

describe("hash utility", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should hash password correctly", async () => {
    bcrypt.genSalt.mockResolvedValue("salt");
    bcrypt.hash.mockResolvedValue("hashedPassword");

    const result = await hashPassword("myPassword");

    expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
    expect(bcrypt.hash).toHaveBeenCalledWith("myPassword", "salt");
    expect(result).toBe("hashedPassword");
  });

  test("should compare passwords correctly", async () => {
    bcrypt.compare.mockResolvedValue(true);
    const result = await comparePassword("plain", "hashed");
    expect(result).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith("plain", "hashed");
  });

  test("should handle bcrypt errors in hashPassword", async () => {
    bcrypt.genSalt.mockRejectedValue(new Error("Salt error"));
    await expect(hashPassword("pass")).rejects.toThrow("Salt error");
  });
});