import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import React, { useState } from "react";

const AdminCreateArticleButton = ({ onArticleCreated }) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "",
    keyPointsText: "",
    guidance: "",
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      type: "",
      keyPointsText: "",
      guidance: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = await getToken();
      let payload = {
        authorClerkId: user?.id,
        type: formData.type,
        title: formData.title,
        tags: [],
        images: [],
      };

      if (formData.type === "Article") {
        const keyPoints = formData.keyPointsText
          .split(/\r?\n|,/) // newline or comma separated
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 12);
        payload = {
          ...payload,
          keyPoints,
          prompt: formData.guidance?.trim() || undefined,
        };
      } else {
        payload = {
          ...payload,
          content: formData.content,
        };
      }

      const res = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/articles`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res?.data?.success) {
        const created = res.data.data;
        if (formData.type === "Article") {
          // Draft created; take admin to preview page
          resetForm();
          setIsEditorOpen(false);
          if (created?._id) {
            navigate(`/community/post/${created._id}`);
          } else if (onArticleCreated) {
            onArticleCreated();
          }
        } else {
          alert("Post created successfully!");
          resetForm();
          setIsEditorOpen(false);
          if (onArticleCreated) onArticleCreated();
        }
      } else {
        alert("Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      const serverMsg = error?.response?.data?.message || error?.response?.data?.error;
      alert(`Failed to create post.${serverMsg ? `\n${serverMsg}` : ""}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    setIsEditorOpen(false);
  };

  if (isEditorOpen) {
    const isArticle = formData.type === "Article";

    return (
      <div className="fixed inset-0 bg-light-surface dark:bg-dark-bg z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-light-surface dark:bg-dark-bg border-b border-light-bg dark:border-dark-surface px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-light-border dark:hover:bg-dark-border rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-light-primary dark:text-dark-primary" />
              </button>
              <h1 className="text-lg font-medium text-light-primary-text dark:text-dark-primary-text">
                {isArticle ? "Generate article" : "Write your post"}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubmit}
                disabled={
                  isLoading ||
                  !formData.type ||
                  !formData.title.trim() ||
                  (!isArticle && !formData.content.trim())
                }
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-full text-sm font-medium transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (isArticle ? "Generating..." : "Publishing...") : (isArticle ? "Generate Draft" : "Publish")}
              </button>
            </div>
          </div>
        </div>

        {/* Editor Content */}
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Title */}
            <textarea
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Title"
              className="w-full text-4xl md:text-5xl font-bold text-light-primary-text dark:text-dark-primary-text placeholder-light-secondary-text/50 dark:placeholder-dark-secondary-text/50 bg-transparent border-none outline-none resize-none overflow-hidden leading-tight mb-2"
              style={{ minHeight: "60px" }}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
            />

            {/* Post Type Selection */}
            <div className="mb-8">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="py-2 pl-2 pr-2 rounded-md bg-light-surface dark:bg-dark-surface text-light-primary-text dark:text-dark-primary-text text-sm"
              >
                <option value="">Select post type</option>
                <option value="Article">Article</option>
                <option value="Announcement">Announcement</option>
                <option value="Alert">Alert</option>
              </select>
            </div>

            {/* Content or AI Inputs */}
            {isArticle ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text mb-2">
                    Key Points
                  </label>
                  <textarea
                    name="keyPointsText"
                    value={formData.keyPointsText}
                    onChange={handleChange}
                    placeholder={"One point per line or comma-separated\nExample:\nWho is at risk\nSymptoms vs common cold\nVaccination benefits"}
                    className="w-full text-base text-light-primary-text dark:text-dark-primary-text placeholder-light-secondary-text/50 dark:placeholder-dark-secondary-text/50 bg-transparent border border-light-border dark:border-dark-border rounded-md outline-none resize-y leading-relaxed p-3"
                    style={{ minHeight: "160px" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-light-secondary-text dark:text-dark-secondary-text mb-2">
                    Additional Guidance (optional)
                  </label>
                  <textarea
                    name="guidance"
                    value={formData.guidance}
                    onChange={handleChange}
                    placeholder="Tone, audience, region specifics, length, sections to emphasize, etc."
                    className="w-full text-base text-light-primary-text dark:text-dark-primary-text placeholder-light-secondary-text/50 dark:placeholder-dark-secondary-text/50 bg-transparent border border-light-border dark:border-dark-border rounded-md outline-none resize-y leading-relaxed p-3"
                    style={{ minHeight: "100px" }}
                  />
                </div>
              </div>
            ) : (
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                placeholder="Write your post..."
                className="w-full text-lg text-light-primary-text dark:text-dark-primary-text placeholder-light-secondary-text/50 dark:placeholder-dark-secondary-text/50 bg-transparent border-none outline-none resize-none leading-relaxed"
                style={{ minHeight: "400px" }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditorOpen(true)}
      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-opacity focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
    >
      <Plus className="w-4 h-4" />
      Create New Post
    </button>
  );
};

export default AdminCreateArticleButton;
