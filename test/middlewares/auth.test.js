const jwt = require("jsonwebtoken");
const { authenticate, authorizeAdmin } = require("../../middlewares/auth");

jest.mock("jsonwebtoken");

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe("Middleware: authenticate", () => {
  it("should return 401 if token is missing", () => {
    const req = { headers: {} };
    const res = mockRes();
    const next = jest.fn();

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "No token provided" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if token is invalid", () => {
    const req = { headers: { authorization: "Bearer invalidtoken" } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation((token, secret, cb) =>
      cb(new Error("Invalid"), null)
    );

    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Invalid token" });
    expect(next).not.toHaveBeenCalled();
  });

  it("should attach decoded user and call next on valid token", () => {
    const req = { headers: { authorization: "Bearer validtoken" } };
    const res = mockRes();
    const next = jest.fn();

    jwt.verify.mockImplementation((token, secret, cb) =>
      cb(null, { id: 1, name: "User" })
    );

    authenticate(req, res, next);
    expect(req.user).toEqual({ id: 1, name: "User" });
    expect(next).toHaveBeenCalled();
  });
});

describe("Middleware: authorizeAdmin", () => {
  it("should return 403 if user not admin", () => {
    const req = { user: { role: "user" } };
    const res = mockRes();
    const next = jest.fn();

    authorizeAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Forbidden: Admins only",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should call next if user is admin", () => {
    const req = { user: { role: "admin" } };
    const res = mockRes();
    const next = jest.fn();

    authorizeAdmin(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
