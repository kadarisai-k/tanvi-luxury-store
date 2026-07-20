const express = require("express");
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  syncCart,
} = require("../controllers/cartController");
const { requireCustomerAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireCustomerAuth);

router.get("/", getCart);
router.post("/add", addToCart);
router.post("/sync", syncCart);
router.put("/update", updateCartItem);
router.delete("/remove/:itemId", removeFromCart);

module.exports = router;
