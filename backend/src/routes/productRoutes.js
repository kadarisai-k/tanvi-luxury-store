const express = require("express");
const {
  listProducts,
  suggestProducts,
  getProductBySlug,
  getHomeSections,
} = require("../controllers/productController");

const router = express.Router();

router.get("/", listProducts);
// Both of these must come before /:slug or they'd be treated as slug lookups.
router.get("/suggest", suggestProducts);
router.get("/home-sections", getHomeSections);
router.get("/:slug", getProductBySlug);

module.exports = router;
