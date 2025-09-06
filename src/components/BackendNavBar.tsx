"use client";
import Link from "next/link";
import { useState } from "react";

type UserType = "agent" | "landlord" | "fsbo" | "admin" | "super_admin";
type NavLink = { label: string; href: string; isButton?: boolean; dropdown?: boolean };

interface BackendNavBarProps {
	userType?: UserType;
}

const registerDropdown: NavLink[] = [
	{ label: "For Sale By Owner", href: "/register/fsbo" },
	{ label: "Agent", href: "/register" },
	{ label: "Landlord", href: "/register/landlord" },
];

const navLinks: Record<UserType, NavLink[]> = {
	agent: [
		{ label: "Dashboard", href: "/dashboard/agent" },
		{ label: "Applications", href: "/admin-dashboard" },
		{ label: "Profile/Settings", href: "/dashboard/agent" },
		{ label: "Register", href: "/register", dropdown: true },
		{ label: "Logout", href: "/logout", isButton: true },
	],
	landlord: [
		{ label: "Dashboard", href: "/dashboard/landlord" },
		{ label: "Profile/Settings", href: "/dashboard/landlord" },
		{ label: "Register", href: "/register", dropdown: true },
		{ label: "Logout", href: "/logout", isButton: true },
	],
	owner: [
		{ label: "Dashboard", href: "/dashboard/owner" },
		{ label: "Profile/Settings", href: "/dashboard/owner/settings" },
		{ label: "Register", href: "/register", dropdown: true },
		{ label: "Logout", href: "/logout", isButton: true },
	],
	admin: [
		{ label: "Admin Dashboard", href: "/admin-dashboard" },
		{ label: "Property Review", href: "/admin-dashboard" },
		{ label: "User Management", href: "/admin-dashboard/users" },
		{ label: "Settings", href: "/admin-dashboard/settings" },
		{ label: "Logout", href: "/logout", isButton: true },
	],
	super_admin: [
		{ label: "Dashboard", href: "/admin-dashboard" },
		{ label: "Applications", href: "/admin-dashboard" },
		{ label: "User Management", href: "/admin-dashboard/users" },
		{ label: "Properties", href: "/admin-dashboard" },
		{ label: "System Settings", href: "/admin-dashboard/settings" },
		{ label: "Admin Management", href: "/admin-dashboard/admin" },
		{ label: "Logout", href: "/logout", isButton: true },
	],
};

const consumerSites = [
	{ label: "Guyana Home Hub", href: "https://guyanahomehub.com", active: true, flag: "🇬🇾" },
	{ label: "Ghana Home Hub", active: false, flag: "🇬🇭" },
	{ label: "Rwanda Home Hub", active: false, flag: "🇷🇼" },
	{ label: "South Africa Home Hub", active: false, flag: "🇿🇦" },
	{ label: "Trinidad Home Hub", active: false, flag: "🇹🇹" },
	{ label: "Jamaica Home Hub", active: false, flag: "🇯🇲" },
	{ label: "Namibia Home Hub", active: false, flag: "🇳🇦" },
	{ label: "DR Home Hub", active: false, flag: "🇩🇴" },
	{ label: "Caribbean Home Hub", active: false, flag: "🏝️" },
];

export default function BackendNavBar({ userType = "agent" }: BackendNavBarProps) {
	const [showDropdown, setShowDropdown] = useState(false);
	const [showSitesDropdown, setShowSitesDropdown] = useState(false);
	const [showCreateDropdown, setShowCreateDropdown] = useState(false);
		return (
			<nav className="bg-blue-900 text-white px-4 py-3 flex flex-col sm:flex-row justify-between items-center shadow-md w-full">
				<Link href="/" className="font-bold text-lg mb-2 sm:mb-0 hover:underline">Portal Home Hub</Link>
				<ul className="flex flex-col sm:flex-row gap-4 sm:gap-6 relative items-center">
					<li className="relative">
						<button
							className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600 flex items-center"
							onClick={() => setShowSitesDropdown((prev) => !prev)}
							onBlur={() => setTimeout(() => setShowSitesDropdown(false), 200)}
						>
							Consumer Sites
							<svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
						</button>
						{showSitesDropdown && (
							<ul className="absolute left-0 top-full mt-2 bg-white text-blue-900 rounded shadow-lg min-w-[220px] z-20">
								{consumerSites.map(site => (
									<li key={site.label} className="flex items-center px-4 py-2">
										<span className="mr-2 text-lg">{site.flag}</span>
										{site.active ? (
											<a href={site.href} target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-900">
												{site.label}
											</a>
										) : (
											<span className="text-gray-400 cursor-not-allowed" title="Coming Soon">
												{site.label} <span className="ml-1 text-xs">(Coming Soon)</span>
											</span>
										)}
									</li>
								))}
							</ul>
						)}
					</li>
					{/* Create Property Dropdown */}
					<li className="relative">
						<button
							className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600 flex items-center"
							onClick={() => setShowCreateDropdown((prev) => !prev)}
							onBlur={() => setTimeout(() => setShowCreateDropdown(false), 200)}
						>
							Create Property
							<svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
						</button>
						{showCreateDropdown && (
							<ul className="absolute left-0 top-full mt-2 bg-white text-blue-900 rounded shadow-lg min-w-[220px] z-20">
								<li>
									<Link href="/dashboard/agent/create-property" className="block px-4 py-2 hover:bg-blue-100">Agent Property</Link>
								</li>
								<li>
									<Link href="/dashboard/owner/create-property" className="block px-4 py-2 hover:bg-blue-100">Owner Sale Listing</Link>
								</li>
								<li>
									<Link href="/dashboard/landlord/create-property" className="block px-4 py-2 hover:bg-blue-100">Landlord Rental</Link>
								</li>
							</ul>
						)}
					</li>
					
					{/* ...existing nav links... */}
					{(userType && navLinks[userType] ? navLinks[userType] : []).map((link: NavLink) =>
						link.isButton ? (
							<li key={link.label}>
								<button
									className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600"
									onClick={() => window.location.href = link.href}
								>
									{link.label}
								</button>
							</li>
						) : link.dropdown ? (
							<li key={link.label} className="relative">
								<button
									className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600"
									onClick={() => setShowDropdown((prev) => !prev)}
									onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
								>
									{link.label}
								</button>
								{showDropdown && (
									<ul className="absolute left-0 top-full mt-2 bg-white text-blue-900 rounded shadow-lg min-w-[180px] z-10">
										{registerDropdown.map((item) => (
											<li key={item.label}>
												<Link href={item.href} className="block px-4 py-2 hover:bg-blue-100">
													{item.label}
												</Link>
											</li>
										))}
									</ul>
								)}
							</li>
						) : (
							<li key={link.label}>
								<Link href={link.href} className="hover:underline">
									{link.label}
								</Link>
							</li>
						)
					)}
				</ul>
			</nav>
		);
}
