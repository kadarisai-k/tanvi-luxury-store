const express = require("express");
const {
  getSettings,
  updateSettings,
  getHomeSectionSettings,
  updateHomeSectionSettings,
} = require("../controllers/settingsController");
const { requireAdminAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", getSettings);
router.put("/", requireAdminAuth, updateSettings);
router.get("/home-sections", requireAdminAuth, getHomeSectionSettings);
router.put("/home-sections", requireAdminAuth, updateHomeSectionSettings);

module.exports = router;
