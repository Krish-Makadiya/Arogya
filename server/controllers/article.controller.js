const Article = require("../schema/articles.schema");
const Doctor = require("../schema/doctor.schema");
const mongoose = require("mongoose");
const { getAuth } = require("@clerk/express");
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ----------------------------------------------------------------------
// Create Article
// ----------------------------------------------------------------------
exports.createArticle = async (req, res) => {
  try {
    const {
      authorClerkId,
      type,
      title,
      content,
      keyPoints = [],
      prompt: genPrompt,
      tags = [],
      images = []
    } = req.body;

    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, title"
      });
    }

    let authorId = undefined;
    if (authorClerkId) {
      const doctor = await Doctor.findOne({ clerkUserId: authorClerkId });
      if (doctor) {
        authorId = doctor._id;
      }
      // If no doctor found, we proceed without authorId to allow Admin-authored posts
    }

    // If it's a standard Article and content is empty, auto-generate using Groq
    let finalContent = content;
    if (type === "Article" && (!finalContent || !String(finalContent).trim())) {
      try {
        const pointsText = Array.isArray(keyPoints)
          ? keyPoints.filter(Boolean).map((p) => `- ${p}`).join("\n")
          : (keyPoints || "");

        const aiUserPrompt = genPrompt && String(genPrompt).trim().length > 0
          ? `\nAdditional guidance:\n${String(genPrompt).trim()}`
          : "";

        const aiPrompt = `You are a medical writer. Write a well-structured blog post for a community health portal.\nTitle: ${title}\nKey points (bulleted):\n${pointsText}\n${aiUserPrompt}\n\nRequirements:\n- Clear introduction, informative body with subheadings, and a concise conclusion.\n- Tone: helpful, accessible, evidence-informed.\n- Add practical tips and, where useful, short bullet lists.\n- Do not fabricate statistics; avoid definitive medical claims without context.\n- Keep formatting as plain text with line breaks and markdown-style headings (##, ###).`;

        const completion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.5,
        });
        finalContent = completion.choices?.[0]?.message?.content?.trim() || "";
      } catch (aiErr) {
        console.error("Groq generation failed, falling back:", aiErr?.message || aiErr);
        // leave finalContent as empty string; validation below will handle
      }
    }

    // For non-Article types, ensure content is present
    if ((type === "Announcement" || type === "Alert") && (!finalContent || !String(finalContent).trim())) {
      return res.status(400).json({
        success: false,
        message: "Content is required for Announcement and Alert",
      });
    }

    // If Article after AI still empty, reject
    if (type === "Article" && (!finalContent || !String(finalContent).trim())) {
      return res.status(422).json({
        success: false,
        message: "AI did not return content. Provide content or try again with keyPoints/prompt.",
      });
    }

    // Create article (authorId may be undefined for Admin-authored posts)
    const article = await Article.create({
      authorId,
      type,
      title,
      content: finalContent,
      tags,
      images
    });

    return res.status(201).json({
      success: true,
      message: "Article created successfully",
      data: article
    });

  } catch (error) {
    console.error("Create Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create article",
      error: error.message
    });
  }
};

exports.removeLike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid article id" });
    }
    const { userId: clerkUserId } = getAuth(req) || {};
    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const content = await Article.findById(id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }

    content.likes = Math.max(0, (content.likes || 0) - 1);
    await content.save();

    return res.json({
      message: "Like removed",
      likes: content.likes,
    });

  } catch (error) {
    console.error("Unlike error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------------------------------------------------------------
// Get Articles by Doctor (via clerk user id)
// ----------------------------------------------------------------------
exports.getArticlesByDoctor = async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    const doctor = await Doctor.findOne({ clerkUserId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const articles = await Article.find({ authorId: doctor._id })
      .populate("authorId", "fullName qualification specialty avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        doctor,
        articles
      }
    });

  } catch (error) {
    console.error("Get Articles by Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// Get All Articles
// ----------------------------------------------------------------------
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({})
      .populate("authorId", "fullName qualification specialty avatar")
      .sort({ createdAt: -1 });

    const { userId: clerkUserId } = getAuth(req) || {};
    const viewerId = clerkUserId || req.user?.id || null;

    const data = articles.map((a) => {
      const obj = a.toObject();
      if (viewerId) {
        obj.isLiked = Array.isArray(obj.likedBy) && obj.likedBy.some((uid) => String(uid) === String(viewerId));
      } else {
        obj.isLiked = false;
      }
      return obj;
    });

    return res.status(200).json({
      success: true,
      data
    });

  } catch (error) {
    console.error("Get All Articles Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// Get Articles Excluding One Doctor
// ----------------------------------------------------------------------
exports.getArticlesExcludingDoctor = async (req, res) => {
  try {
    const { clerkUserId } = req.params;

    const doctor = await Doctor.findOne({ clerkUserId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    const articles = await Article.find({
      authorId: { $ne: doctor._id }
    })
      .populate("authorId", "fullName qualification specialty avatar")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        excludedDoctor: doctor,
        articles
      }
    });

  } catch (error) {
    console.error("Get Articles Excluding Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch articles",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// Get Single Article by ID
// ----------------------------------------------------------------------
exports.getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id)
      .populate("authorId", "fullName qualification specialty avatar");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found"
      });
    }

    const { userId: clerkUserId } = getAuth(req) || {};
    const viewerId = clerkUserId || req.user?.id || null;

    // Increment views on each detail view
    article.views += 1;
    await article.save();

    const obj = article.toObject();
    if (viewerId) {
      obj.isLiked = Array.isArray(obj.likedBy) && obj.likedBy.some((uid) => String(uid) === String(viewerId));
    } else {
      obj.isLiked = false;
    }

    return res.status(200).json({
      success: true,
      data: obj
    });

  } catch (error) {
    console.error("Get Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch article",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// Update Article
// ----------------------------------------------------------------------
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that cannot be updated
    delete updateData.authorId;
    delete updateData.views;
    delete updateData.slug;
    delete updateData.publishedAt;

    const article = await Article.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article updated successfully",
      data: article
    });

  } catch (error) {
    console.error("Update Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update article",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// Publish Article (set publishedAt)
// ----------------------------------------------------------------------
exports.publishArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByIdAndUpdate(
      id,
      { publishedAt: new Date() },
      { new: true }
    );

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article published successfully",
      data: article
    });

  } catch (error) {
    console.error("Publish Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish article",
      error: error.message
    });
  }
};

// ----------------------------------------------------------------------
// Delete Article
// ----------------------------------------------------------------------
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findByIdAndDelete(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully"
    });

  } catch (error) {
    console.error("Delete Article Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete article",
      error: error.message
    });
  }
};

exports.addLike = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid article id" });
    }
    const { userId: clerkUserId } = getAuth(req) || {};
    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const content = await Article.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (!Array.isArray(content.likedBy)) content.likedBy = [];
    if (typeof content.likes !== 'number') content.likes = 0;

    const alreadyLiked = content.likedBy.some((uid) => String(uid) === String(clerkUserId));
    if (alreadyLiked) {
      return res.status(400).json({ message: "Already liked", likes: content.likes });
    }

    content.likes = (content.likes || 0) + 1;
    content.likedBy.push(String(clerkUserId));
    await content.save();

    return res.json({ message: "Liked", likes: content.likes });
  } catch (error) {
    console.error("Like error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.removeLike = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: clerkUserId } = getAuth(req) || {};
    if (!clerkUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const content = await Article.findById(id);
    if (!content) return res.status(404).json({ message: "Content not found" });

    if (!Array.isArray(content.likedBy)) content.likedBy = [];
    if (typeof content.likes !== 'number') content.likes = 0;

    const hadLiked = content.likedBy.some((uid) => String(uid) === String(clerkUserId));
    if (!hadLiked) {
      return res.status(400).json({ message: "Not liked before", likes: content.likes });
    }

    content.likes = Math.max(0, (content.likes || 0) - 1);
    content.likedBy = content.likedBy.filter((uid) => String(uid) !== String(clerkUserId));

    await content.save();

    return res.json({ message: "Unliked", likes: content.likes });
  } catch (error) {
    console.error("Unlike error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
