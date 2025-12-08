import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../../../components/Sidebar";
import AllArticles from "./AllArticles";
import CreateArticleButton from "../../../components/Doctor/CreateArticleButton";
import AdminCreateArticleButton from "../../../components/Admin/AdminCreateArticleButton";

const DoctorArticles = ({ tabs }) => {
    const location = useLocation();
    const isAdminView = (location?.pathname || "").startsWith("/admin");
    const [activeTab, setActiveTab] = useState("all-articles");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleArticleCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="flex relative">
            <Sidebar tabs={tabs} getActiveTab={() => activeTab} />
            <div className="min-h-screen w-full bg-light-bg dark:bg-dark-surface md:py-8 md:px-5 py-5">
                <div className="mb-4 flex justify-between gap-4 border-b border-light-secondary-text/20 dark:border-dark-secondary-text/20">
                    <div>
                        <button
                            className={`px-4 py-2 font-semibold rounded-t-lg transition-colors duration-200 focus:outline-none bg-light-primary text-white dark:bg-dark-primary`}
                            onClick={() => setActiveTab("all-articles")}
                        >
                            All Posts
                        </button>
                    </div>
                    {isAdminView ? (
                        <AdminCreateArticleButton onArticleCreated={handleArticleCreated} />
                    ) : (
                        <CreateArticleButton onArticleCreated={handleArticleCreated} />
                    )}
                </div>
                {loading ? (
                    <div className="p-6">Loading…</div>
                ) : error ? (
                    <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
                ) : (
                    <AllArticles key={refreshTrigger} />
                )}
            </div>
        </div>
    );
};

export default DoctorArticles;
