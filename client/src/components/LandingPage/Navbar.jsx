import { useState } from "react";
import {
    Dialog,
    DialogPanel,
    Disclosure,
    DisclosureButton,
    DisclosurePanel,
    Popover,
    PopoverButton,
    PopoverGroup,
    PopoverPanel,
} from "@headlessui/react";
import {
    RefreshCcw,
    Menu,
    PieChart,
    MousePointerClick,
    Fingerprint,
    Grid,
    X,
    ChevronDown,
    Phone,
    PlayCircle,
    Moon,
    Sun,
    LayoutDashboard,
} from "lucide-react";
import { useTheme } from "../../context/ThemeProvider";
import { useNavigate } from "react-router-dom";
import GoogleTranslater from "./GoogleTranslater";
import { useUser } from "../../context/UserContext";
import SignIn from "../auth/SignIn";
import SignUp from "../auth/SignUp";

const products = [
    {
        name: "Analytics",
        description: "Get a better understanding of your traffic",
        href: "#",
        icon: PieChart,
    },
    {
        name: "Engagement",
        description: "Speak directly to your customers",
        href: "#",
        icon: MousePointerClick,
    },
    {
        name: "Security",
        description: "Your customers’ data will be safe and secure",
        href: "#",
        icon: Fingerprint,
    },
    {
        name: "Integrations",
        description: "Connect with third-party tools",
        href: "#",
        icon: Grid,
    },
    {
        name: "Automations",
        description: "Build strategic funnels that will convert",
        href: "#",
        icon: RefreshCcw,
    },
];
const callsToAction = [
    { name: "Watch demo", href: "#", icon: PlayCircle },
    { name: "Contact sales", href: "#", icon: Phone },
];

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [authMode, setAuthMode] = useState(null); // "signin" | "signup" | null
    const { theme, setTheme } = useTheme();
    const navigate = useNavigate();

    const { user, isLoaded, isSignedIn } = useUser();

    // Function to get dashboard route based on user role
    const getDashboardRoute = () => {
        if (!isLoaded || !user) return "/dashboard";
        
        console.log("user", user);
        const userRole = user.metadata?.role;
        console.log(userRole);
        if (!userRole) return "/dashboard";

        switch (userRole) {
            case "Patient":
                return "/patient/dashboard";
            case "Doctor":
                return "/doctor/dashboard";
            case "Admin":
                return "/admin/dashboard";
            case "Pharmacy":
                return "/pharmacy/dashboard";
            default:
                return "/dashboard";
        }
    };

    const handleDashboardClick = () => {
        const route = getDashboardRoute();
        navigate(route);
    };

    return (
        <header className="absolute w-screen z-50">
            <nav
                aria-label="Global"
                className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                    <a href="/" className="flex items-center gap-2">
                        <img
                            src={"/aroga-logo.png"}
                            alt="Arogya Logo"
                            className="h-10 w-10"
                        />
                        <span className="text-2xl font-bold text-light-primary-text dark:text-dark-primary-text">
                            Arogya
                        </span>
                    </a>
                </div>
                <div className="flex lg:hidden">
                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen(true)}
                        className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                        <span className="sr-only">Open main menu</span>
                        <Menu aria-hidden="true" className="size-6" />
                    </button>
                </div>
                <PopoverGroup className="hidden lg:flex lg:gap-x-12">
                    <Popover className="relative">
                        <PopoverButton className="flex items-center gap-x-1 text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                            Product
                            <ChevronDown
                                aria-hidden="true"
                                className="size-5 flex-none text-light-secondary-text dark:text-dark-secondary-text"
                            />
                        </PopoverButton>

                        <PopoverPanel
                            transition
                            className="absolute left-1/2 z-10 mt-3 w-screen max-w-md -translate-x-1/2 overflow-hidden rounded-3xl bg-light-surface dark:bg-dark-surface shadow-lg outline-1 outline-light-primary/10 dark:outline-dark-primary/10 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in">
                            <div className="p-4">
                                {products.map((item) => (
                                    <div
                                        key={item.name}
                                        className="group relative flex items-center gap-x-6 rounded-lg p-4 text-sm/6 hover:bg-light-bg dark:hover:bg-dark-bg cursor-pointer transition">
                                        <div className="flex size-11 flex-none items-center justify-center rounded-lg bg-light-bg dark:bg-dark-bg group-hover:bg-light-surface dark:group-hover:bg-dark-surface">
                                            <item.icon
                                                aria-hidden="true"
                                                className="size-6 text-light-secondary-text dark:text-dark-secondary-text group-hover:text-light-primary dark:group-hover:text-dark-primary"
                                            />
                                        </div>
                                        <div className="flex-auto">
                                            <a
                                                href={item.href}
                                                className="block font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                                                {item.name}
                                                <span className="absolute inset-0" />
                                            </a>
                                            <p className="mt-1 text-light-secondary-text dark:text-dark-secondary-text">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 divide-x divide-light-secondary/10 dark:divide-dark-secondary/10 bg-light-bg dark:bg-dark-bg">
                                {callsToAction.map((item) => (
                                    <a
                                        key={item.name}
                                        href={item.href}
                                        className="flex items-center justify-center gap-x-2.5 p-3 text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                        <item.icon
                                            aria-hidden="true"
                                            className="size-5 flex-none text-light-secondary-text dark:text-dark-secondary-text"
                                        />
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        </PopoverPanel>
                    </Popover>

                    <a
                        href="#"
                        className="text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                        Features
                    </a>
                    <a
                        href="#"
                        className="text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                        Marketplace
                    </a>
                    <a
                        href="#"
                        className="text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                        Company
                    </a>
                </PopoverGroup>
                <div className="hidden lg:flex lg:flex-1 gap-5 lg:justify-end items-center">
                    {
                        <div className="flex gap-6 items-center">
                            {isSignedIn ? (
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleDashboardClick}
                                        className="flex items-center gap-2 text-sm/6 font-semibold text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                                        Dashboard
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setAuthMode("signin")}
                                            className="inline-flex items-center gap-2 rounded-full bg-light-primary text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-primary-dark transition">
                                            Sign In
                                        </button>
                                        <button
                                            onClick={() => setAuthMode("signup")}
                                            className="inline-flex items-center gap-2 rounded-full border border-light-primary text-light-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-bg transition">
                                            Sign Up
                                        </button>
                                    </div>
                                    {authMode === "signin" && (
                                        <div className="absolute top-full mt-3 bg-white dark:bg-dark-bg shadow-lg rounded-xl p-4 w-80 z-20">
                                            <SignIn />
                                        </div>
                                    )}
                                    {authMode === "signup" && (
                                        <div className="absolute top-full mt-3 bg-white dark:bg-dark-bg shadow-lg rounded-xl p-4 w-80 z-20">
                                            <SignUp />
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    }
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() =>
                                setTheme(theme === "dark" ? "light" : "dark")
                            }
                            className="cursor-pointer text-light-primary-text dark:text-dark-primary-text">
                            {theme === "dark" ? <Moon /> : <Sun />}
                        </button>
                        <GoogleTranslater />
                    </div>
                </div> 
            </nav>
            <Dialog
                open={mobileMenuOpen}
                onClose={setMobileMenuOpen}
                className="lg:hidden">
                <div className="fixed inset-0 z-50" />
                <DialogPanel className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-light-bg dark:bg-dark-bg p-6 sm:max-w-sm sm:ring-1 sm:ring-light-primary/10 dark:sm:ring-dark-primary/10">
                    <div className="flex items-center justify-between">
                        <a href="#" className="-m-1.5 p-1.5 cursor-pointer">
                            <span className="sr-only">Your Company</span>
                            <img
                                alt=""
                                src="https://tailwindcss.com/plus-assets/img/logos/mark.svg?color=indigo&shade=600"
                                className="h-8 w-auto"
                            />
                        </a>
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(false)}
                            className="-m-2.5 rounded-md p-2.5 text-light-primary-text dark:text-dark-primary-text cursor-pointer">
                            <span className="sr-only">Close menu</span>
                            <X aria-hidden="true" className="size-6" />
                        </button>
                    </div>
                    <div className="mt-6 flow-root">
                        <div className="-my-6 divide-y divide-light-secondary/20 dark:divide-dark-secondary/20">
                            <div className="space-y-2 py-6">
                                <Disclosure as="div" className="-mx-3">
                                    <DisclosureButton className="group flex w-full items-center justify-between rounded-lg py-2 pr-3.5 pl-3 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                        Product
                                        <ChevronDown
                                            aria-hidden="true"
                                            className="size-5 flex-none group-data-open:rotate-180 text-light-secondary-text dark:text-dark-secondary-text"
                                        />
                                    </DisclosureButton>
                                    <DisclosurePanel className="mt-2 space-y-2">
                                        {[...products, ...callsToAction].map(
                                            (item) => (
                                                <DisclosureButton
                                                    key={item.name}
                                                    as="a"
                                                    href={item.href}
                                                    className="block rounded-lg py-2 pr-3 pl-6 text-sm/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                                    {item.name}
                                                </DisclosureButton>
                                            )
                                        )}
                                    </DisclosurePanel>
                                </Disclosure>
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                    Features
                                </a>
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                    Marketplace
                                </a>
                                <a
                                    href="#"
                                    className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                    Company
                                </a>
                            </div>
                            <div className="py-6 flex flex-col gap-3">
                                <button
                                    onClick={() =>
                                        setTheme(
                                            theme === "dark" ? "light" : "dark"
                                        )
                                    }
                                    className="cursor-pointer text-light-primary-text dark:text-dark-primary-text">
                                    {theme === "dark" ? (
                                        <div className="flex gap-2">
                                            <Moon /> <p>Dark Mode</p>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Sun /> <p>Light Mode</p>
                                        </div>
                                    )}
                                </button>
                                <div className="max-w-[280px]">
                                    <GoogleTranslater />
                                </div>
                                {isSignedIn ? (
                                    <button
                                        onClick={() => {
                                            handleDashboardClick();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="-mx-3 flex items-center gap-2 rounded-lg px-3 py-2.5 text-base/7 font-semibold text-light-primary-text dark:text-dark-primary-text hover:bg-light-surface dark:hover:bg-dark-surface cursor-pointer">
                                        <LayoutDashboard className="size-5" />
                                        Dashboard
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setAuthMode("signin")}
                                            className="w-full rounded-lg bg-light-primary text-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-primary-dark transition">
                                            Sign In
                                        </button>
                                        <button
                                            onClick={() => setAuthMode("signup")}
                                            className="w-full rounded-lg border border-light-primary text-light-primary px-4 py-2 text-sm font-semibold shadow-sm hover:bg-light-bg transition">
                                            Sign Up
                                        </button>
                                        {authMode === "signin" && <SignIn />}
                                        {authMode === "signup" && <SignUp />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogPanel>
            </Dialog>
        </header>
    );
}
