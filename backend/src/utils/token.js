const jwt = require("jsonwebtoken");

function signAdminToken(user) {
  return jwt.sign(
    { id: user._id, role: "admin", email: user.email },
    process.env.ADMIN_JWT_SECRET,
    { expiresIn: "1d" }
  );
}

function verifyAdminToken(token) {
  return jwt.verify(token, process.env.ADMIN_JWT_SECRET);
}

// Customer auth (email-OTP login). Signed JWTs instead of an in-memory
// session Map — the old Map-based session store lost every logged-in
// customer whenever the Node process restarted (free-tier hosts like
// Render/Railway spin the server down after idle periods and restart it
// on the next request), which is why "please log in again" kept showing
// up even though localStorage still had a token. A JWT verifies itself
// from its signature, so it survives restarts with no server-side state.
function signCustomerToken(email) {
  return jwt.sign({ email }, process.env.CUSTOMER_JWT_SECRET, { expiresIn: "30d" });
}

function verifyCustomerToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.CUSTOMER_JWT_SECRET);
    return decoded.email;
  } catch {
    return null;
  }
}

module.exports = { signAdminToken, verifyAdminToken, signCustomerToken, verifyCustomerToken };
