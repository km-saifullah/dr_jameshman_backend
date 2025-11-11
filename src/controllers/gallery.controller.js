import fs from "fs";
import Gallery from "../models/gallery.model.js";
import cloudinary from "../utils/cloudinary.js";

// create gallery
export const createGallery = async (req, res) => {
  try {
    const { before, after } = req.files;

    if (!before || !after) {
      return res.status(400).json({
        status: false,
        message: "Both before and after images are required",
        data: null,
      });
    }

    const beforePath = before[0].path;
    const afterPath = after[0].path;

    const beforeUpload = await cloudinary.uploader.upload(beforePath, {
      folder: "gallery",
    });

    console.log(beforeUpload);

    const afterUpload = await cloudinary.uploader.upload(afterPath, {
      folder: "gallery",
    });

    fs.unlinkSync(beforePath);
    fs.unlinkSync(afterPath);

    const gallery = await Gallery.create({
      before: {
        // imageName: before[0].originalname,
        imageName: beforeUpload.secure_url,
        cloudinaryId: beforeUpload.public_id,
      },
      after: {
        // imageName: after[0].originalname,
        imageName: afterUpload.secure_url,
        cloudinaryId: afterUpload.public_id,
      },
    });

    return res.status(201).json({
      status: true,
      message: "Gallery created successfully",
      data: gallery,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server error",
      data: error.message,
    });
  }
};

// get all galleries
export const getAllGalleries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const galleries = await Gallery.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Gallery.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      status: true,
      message: "Galleries fetched successfully",
      data: galleries,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: "Internal Server error",
      data: err.message,
    });
  }
};

// get single gallery
export const getSingleGallery = async (req, res) => {
  try {
    const { id } = req.params;
    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({
        status: false,
        message: "Gallery not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Gallery fetched successfully",
      data: gallery,
    });
  } catch (err) {
    console.error("Error fetching gallery:", err);
    return res.status(500).json({
      status: false,
      message: "Internal Server error",
      data: err.message,
    });
  }
};

// delete gallery
export const deleteGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        status: false,
        message: "Gallery not found",
        data: null,
      });
    }

    await cloudinary.uploader.destroy(gallery.before.cloudinaryId);
    await cloudinary.uploader.destroy(gallery.after.cloudinaryId);

    await gallery.deleteOne();

    return res.status(200).json({
      status: true,
      message: "Gallery deleted successfully",
      data: null,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Internal Server error",
      data: error.message,
    });
  }
};

// update gallery
export const updateGallery = async (req, res) => {
  try {
    const gallery = await Gallery.findById(req.params.id);

    if (!gallery) {
      return res.status(404).json({
        status: false,
        message: "Gallery item not found",
        data: null,
      });
    }

    const { before, after } = req.files;

    if (before) {
      await cloudinary.uploader.destroy(gallery.before.cloudinaryId);

      const beforePath = before[0].path;
      const beforeUpload = await cloudinary.uploader.upload(beforePath, {
        folder: "gallery",
      });

      fs.unlinkSync(beforePath);

      gallery.before = {
        imageName: beforeUpload.secure_url,
        cloudinaryId: beforeUpload.public_id,
      };
    }

    if (after) {
      await cloudinary.uploader.destroy(gallery.after.cloudinaryId);

      const afterPath = after[0].path;
      const afterUpload = await cloudinary.uploader.upload(afterPath, {
        folder: "gallery",
      });

      fs.unlinkSync(afterPath);

      gallery.after = {
        imageName: afterUpload.secure_url,
        cloudinaryId: afterUpload.public_id,
      };
    }

    await gallery.save();

    return res.status(200).json({
      status: true,
      message: "Gallery updated successfully",
      data: gallery,
    });
  } catch (error) {
    console.error("Error updating gallery:", error);
    return res.status(500).json({
      status: false,
      message: "Internal Server error",
      data: error.message,
    });
  }
};
