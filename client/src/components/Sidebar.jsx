import { PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar({
    isCollapsed,
    handleCollapse,
    tabs = [],
    user,
    getActiveTab,
}) {
    const navigate = useNavigate();
    const location = useLocation();

    const currentActiveTabName = typeof getActiveTab === "function"
        ? getActiveTab()
        : tabs?.find((tab) => tab?.path === location.pathname)?.name || tabs?.[0]?.name || "";

    return (
        <>
            {/* ---------------- MOBILE OVERLAY ---------------- */}
            <div
                className={`
                    fixed inset-0 z-40 bg-black/30 transition-opacity duration-500
                    ${
                        isCollapsed
                            ? "pointer-events-none opacity-0"
                            : "pointer-events-auto opacity-100"
                    }
                    md:hidden
                `}
                onClick={handleCollapse}
                aria-hidden="true"
            />

            {/* ---------------- SIDEBAR ---------------- */}
            <aside
                className={`
                    top-0 left-0 h-screen bg-light-surface dark:bg-dark-bg 
                    text-light-primary-text dark:text-dark-primary-text 
                    flex flex-col px-3 py-5 transition-all duration-300 ease-in-out z-50

                    ${
                        isCollapsed
                            ? "w-0 overflow-hidden md:w-20 md:block hidden md:relative fixed"
                            : "w-full fixed md:w-60 md:sticky md:left-0"
                    }
                `}>
                {/* Header */}
                <div
                    className={`flex px-2 ${
                        isCollapsed ? "justify-center" : "justify-between"
                    } items-center w-full`}>
                    <div
                        className={`overflow-hidden transition-all duration-300 ${
                            isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                        }`}>
                        <img
                            className="cursor-pointer"
                            onClick={() => navigate("/")}
                            src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                            height={36}
                            width={36}
                        />
                    </div>
                    <button
                        onClick={handleCollapse}
                        className="rounded-lg hover:bg-light-hover dark:hover:bg-dark-hover p-2 md:opacity-100">
                        {isCollapsed ? (
                            <PanelLeftOpen size={26} />
                        ) : (
                            <PanelLeftClose size={26} />
                        )}
                    </button>
                </div>

                <hr className="mt-3 mb-4 border-light-border dark:border-dark-border opacity-20" />

                {/* --------------- NAV LINKS ---------------- */}
                <nav>
                    <ul className="space-y-1">
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                onClick={() => {
                                    navigate(tab.path);
                                    if (window.innerWidth < 768)
                                        handleCollapse();
                                }}
                                className={`
                                    cursor-pointer px-4 py-3 text-base rounded-lg
                                    transition-all duration-300 ease-in-out
                                    ${
                                        currentActiveTabName === tab.name
                                            ? "bg-light-primary/15 dark:bg-dark-primary/10 text-light-primary dark:text-dark-primary"
                                            : "hover:bg-light-hover dark:hover:bg-dark-hover"
                                    }
                                `}>
                                <div className="flex items-center">
                                    <tab.icon size={22} className="shrink-0" />
                                    <span
                                        className={`ml-2 transition-all text-sm font-semibold ${
                                            isCollapsed
                                                ? "w-0 opacity-0"
                                                : "w-auto opacity-100"
                                        } overflow-hidden whitespace-nowrap`}>
                                        {tab.name}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </nav>

                <hr className="mt-3 mb-5 border-light-border dark:border-dark-border opacity-20" />

                {/* --------------- USER SECTION ---------------- */}
                <div className="flex items-center md:justify-center justify-start px-2">
                    {!isCollapsed ? (
                        <div className="flex items-center gap-2">
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox: "w-12 h-12",
                                    },
                                }}
                            />

                            <p className="font-medium text-lg whitespace-nowrap">
                                {user?.fullName ||
                                    `${user?.firstName || ""} ${
                                        user?.lastName || ""
                                    }` ||
                                    "User"}
                            </p>
                        </div>
                    ) : (
                        <UserButton
                            appearance={{
                                elements: {
                                    userButtonAvatarBox: "w-20 h-20",
                                },
                            }}
                        />
                    )}
                </div>
            </aside>

            {/* ---------------- MOBILE TOGGLE BUTTON ---------------- */}
            <button
                onClick={handleCollapse}
                className="rounded-lg absolute hover:bg-light-hover dark:hover:bg-dark-hover 
                        px-4 py-6 md:hidden z-50"
                style={{ left: 0, top: 0 }}>
                {isCollapsed && <PanelLeftOpen size={26} />}
            </button>

            {/* ---------------- MOBILE BOTTOM NAV (ICONS ONLY) ---------------- */}
            <nav
                className="
                    fixed bottom-0 left-0 right-0 
                    bg-light-surface dark:bg-dark-bg 
                    border-t border-light-border dark:border-dark-border 
                    md:hidden flex justify-around py-2 z-50
                ">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            navigate(tab.path);
                            handleCollapse?.(); // collapse sidebar if open
                        }}
                        className={`
                            flex flex-col items-center p-2 
                            ${
                                currentActiveTabName === tab.name
                                    ? "text-light-primary dark:text-dark-primary"
                                    : "text-light-primary-text dark:text-dark-primary-text opacity-70"
                            }
                        `}>
                        <tab.icon size={24} />
                    </button>
                ))}
            </nav>
        </>
    );
}
