const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

// Uploads a buffer (from multer memory storage) to Cloudinary.
function uploadBuffer(buffer, folder = "tanvi-store/products") {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function uploadMultiple(files, folder) {
  return Promise.all(files.map((file) => uploadBuffer(file.buffer, folder)));
}

async function deleteImage(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Failed to delete Cloudinary image:", publicId, err.message);
  }
}

module.exports = { uploadBuffer, uploadMultiple, deleteImage };
