const { verifyAdminToken, verifyCustomerToken } = require("../utils/token");
const { ApiError } = require("../utils/apiError");
const User = require("../models/User");

function getBearerToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.split(" ")[1];
  return null;
}

// Requires a logged-in customer. Attaches req.user.
// Customer sessions are signed JWTs (see utils/token.js) verified by
// signature alone, so no server-side session store is needed and logins
// survive server restarts/redeploys.
const requireCustomerAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const email = verifyCustomerToken(token);
    if (!email) throw new ApiError(401, "Please log in to continue");
    const user = await User.findOne({ email });
    if (!user || !user.isActive) throw new ApiError(401, "Session invalid, please log in again");
    req.user = user;
    next();
  } catch (err) {
    next(new ApiError(401, "Please log in to continue"));
  }
};

// Optional auth: attaches req.user if a valid token is present, but doesn't block guests.
// Used for routes like "browse products" where login is optional.
const optionalCustomerAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    const email = verifyCustomerToken(token);
    if (!email) return next();
    const user = await User.findOne({ email });
    if (user && user.isActive) req.user = user;
    next();
  } catch (err) {
    next();
  }
};

// Requires a logged-in admin. Attaches req.admin.
// Admin auth is unchanged (email+password -> JWT), sent as a Bearer token.
const requireAdminAuth = async (req, res, next) => {
  try {
    const token = getBearerToken(req) || (req.cookies && req.cookies.adminToken);
    if (!token) throw new ApiError(401, "Admin login required");
    const decoded = verifyAdminToken(token);
    const admin = await User.findById(decoded.id);
    if (!admin || admin.role !== "admin") throw new ApiError(403, "Not authorized as admin");
    req.admin = admin;
    next();
  } catch (err) {
    next(new ApiError(401, "Admin login required"));
  }
};

module.exports = { requireCustomerAuth, optionalCustomerAuth, requireAdminAuth };
