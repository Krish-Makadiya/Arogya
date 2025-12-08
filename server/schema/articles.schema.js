const mongoose = require("mongoose");

const articleTypes = ["Article", "Announcement", "Alert"];

const articleSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: false,
    },

    type: {
      type: String,
      enum: articleTypes,
      default: "Article",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
    },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
      minlength: 1,
    },

    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],

    tags: {
      type: [String],
      default: [],
    },
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    views: {
      type: Number,
      default: 0,
    },
  },

  {
    timestamps: true,
  }
);

// Auto-generate slug before save
articleSchema.pre("save", function (next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")   // remove special chars
      .replace(/\s+/g, "-")           // replace spaces with -
      .replace(/-+/g, "-")            // remove multiple dashes
      .replace(/^-+|-+$/g, "");       // trim starting/ending dash
  }

  next();
});

module.exports = mongoose.model("Article", articleSchema);
