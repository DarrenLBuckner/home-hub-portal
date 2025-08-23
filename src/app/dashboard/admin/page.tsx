"use client";
import ApplicationList from "./components/ApplicationList";

export default function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6 text-teal-700">Admin & Super Admin Dashboard</h1>
      <ApplicationList />
    </div>
  );
}
