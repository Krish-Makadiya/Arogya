import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import axios from "axios";
import { Calendar, Loader2 } from "lucide-react";

const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    } catch {
        return "";
    }
};

export default function PostDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { getToken } = useAuth();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const token = await getToken();
            const res = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/api/articles/${id}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            if (res.data.success) {
                setPost(res.data.data);
            } else {
                setError("Post not found");
            }
        } catch (err) {
            console.error("Failed to load post", err);
            setError("Failed to load post");
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        try {
            const token = await getToken();
            await axios.put(
                `${import.meta.env.VITE_SERVER_URL}/api/articles/${id}/publish`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            // update local state to reflect published status
            setPost((prev) => prev ? { ...prev, publishedAt: new Date().toISOString() } : prev);
            // redirect back to admin articles
            navigate('/admin/articles', { replace: true });
        } catch (err) {
            console.error("Publish failed", err);
            alert("Failed to publish the article.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin" />
            </div>
        );
    }
    if (error || !post) {
        return (
            <div className="min-h-screen p-6 text-center">
                <p className="text-red-500">{error || "Post not found"}</p>
            </div>
        );
    }

    const emoji =
        post.type === "Announcement"
            ? "📢"
            : post.type === "Alert"
            ? "🚨"
            : "📝";

    const MarkdownContent = ({ content }) => {
        if (!content) return null;

        const lines = String(content).split(/\r?\n/);

        const formatInline = (text) => {
            // bold: **text** and italic: *text*
            const parts = [];
            let remaining = text;
            const regex = /(\*\*[^*]+\*\*)|(\*[^*]+\*)/g;
            let lastIndex = 0;
            let m;
            while ((m = regex.exec(text)) !== null) {
                if (m.index > lastIndex) {
                    parts.push(text.slice(lastIndex, m.index));
                }
                const match = m[0];
                if (match.startsWith('**')) {
                    parts.push(<strong key={parts.length}>{match.slice(2, -2)}</strong>);
                } else if (match.startsWith('*')) {
                    parts.push(<em key={parts.length}>{match.slice(1, -1)}</em>);
                }
                lastIndex = m.index + match.length;
            }
            if (lastIndex < text.length) parts.push(text.slice(lastIndex));
            return parts.length ? parts : text;
        };

        // Group lines into blocks (paragraphs and lists)
        const blocks = [];
        let i = 0;
        while (i < lines.length) {
            const line = lines[i];
            if (/^\s*$/.test(line)) { i++; continue; }

            // Headings #####, ####, ###, ##, #
            const h = line.match(/^(#{1,6})\s+(.*)$/);
            if (h) {
                const level = h[1].length;
                const text = h[2].replace(/^\*\*|\*\*$/g, '');
                blocks.push({ type: 'heading', level, text });
                i++; continue;
            }

            // Unordered list (group contiguous items)
            if (/^\s*[-*]\s+/.test(line)) {
                const items = [];
                while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
                    items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
                    i++;
                }
                blocks.push({ type: 'ul', items });
                continue;
            }

            // Paragraph (consume until blank line or next block)
            const para = [line];
            i++;
            while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^\s*[-*]\s+/.test(lines[i]) && !/^(#{1,6})\s+/.test(lines[i])) {
                para.push(lines[i]);
                i++;
            }
            blocks.push({ type: 'p', text: para.join(' ') });
        }

        return (
            <div className="prose dark:prose-invert max-w-none leading-relaxed text-light-primary-text dark:text-dark-primary-text">
                {blocks.map((b, idx) => {
                    if (b.type === 'heading') {
                        const Tag = `h${Math.min(6, Math.max(1, b.level + 1))}`; // shift down one level for visual hierarchy
                        return <Tag key={idx}>{formatInline(b.text)}</Tag>;
                    }
                    if (b.type === 'ul') {
                        return (
                            <ul key={idx} className="list-disc pl-6">
                                {b.items.map((it, j) => (
                                    <li key={j}>{formatInline(it)}</li>
                                ))}
                            </ul>
                        );
                    }
                    return <p key={idx}>{formatInline(b.text)}</p>;
                })}
            </div>
        );
    };

    return (
        <div className="min-h-screen p-6 bg-light-surface dark:bg-dark-bg">
            <div className="max-w-4xl mx-auto bg-light-surface dark:bg-dark-bg rounded-lg shadow-sm p-6">
                <div className="mb-4">
                    <div className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded bg-light-bg dark:bg-dark-surface">
                        <span className="text-light-primary-text dark:text-dark-primary-text">{post.type}</span>
                    </div>
                </div>
                <h1 className="text-3xl font-bold mb-2 text-light-primary-text dark:text-dark-primary-text">
                    {emoji} {post.title}
                </h1>
                <div className="text-sm text-light-secondary-text dark:text-dark-secondary-text flex items-center gap-2 mb-6">
                    <Calendar className="w-4 h-4" />
                    <span>
                        {post.publishedAt
                            ? `Published ${formatDate(post.publishedAt)}`
                            : `Created ${formatDate(post.createdAt)}`}
                    </span>
                    <span>•</span>
                    <span>
                        {post.authorId?.fullName
                            ? `Dr. ${post.authorId.fullName}`
                            : "Dr. Unknown"}
                    </span>
                </div>
                <MarkdownContent content={post.content} />

                {/* Admin-only Publish CTA when not published */}
                {!post.publishedAt && (
                    <div className="mt-6">
                        <button
                            onClick={handlePublish}
                            className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm font-medium"
                        >
                            Publish
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
