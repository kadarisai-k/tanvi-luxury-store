const express = require("express");
const {
  adminListProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { requireAdminAuth } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

router.use(requireAdminAuth);

router.get("/", adminListProducts);
router.post("/", upload.array("images", 6), createProduct);
router.put("/:id", upload.array("images", 6), updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
