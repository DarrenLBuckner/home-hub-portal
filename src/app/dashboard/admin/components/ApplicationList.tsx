"use client";
import { useEffect, useState } from "react";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

async function fetchApplications() {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.from("agent_vetting").select("*");
  if (error) {
    console.error("Error fetching applications:", error.message);
    return [];
  }
  return data || [];
}

export default function ApplicationList() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState("");
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications().then((data) => {
      setApplications(data);
      setLoading(false);
    });
  }, []);

  const supabase = createClientComponentClient();

  const sendStatusEmail = async (app: any, status: string, note?: string) => {
    let paymentLink = "";
    // Payment page removed; do not generate paymentLink
    if (status === "approved") {
      paymentLink = "";
    }
    await fetch("/api/send-status-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: app.email,
        name: `${app.first_name} ${app.last_name}`,
        status,
        note,
  paymentLink: undefined,
      }),
    });
  };

  const handleApprove = async (appId: string) => {
    await supabase.from("agent_vetting").update({ status: "approved" }).eq("id", appId);
    setApplications((prev) => prev.map((app) => app.id === appId ? { ...app, status: "approved" } : app));
    const app = applications.find((a) => a.id === appId);
    if (app) await sendStatusEmail(app, "approved");
  };

  const handleDeny = async (appId: string) => {
    await supabase.from("agent_vetting").update({ status: "denied" }).eq("id", appId);
    setApplications((prev) => prev.map((app) => app.id === appId ? { ...app, status: "denied" } : app));
    const app = applications.find((a) => a.id === appId);
    if (app) await sendStatusEmail(app, "denied");
  };

  const handleMoreInfo = (appId: string) => {
    setSelectedAppId(appId);
    setShowModal(true);
    setNote("");
  };

  const handleSaveNote = async () => {
    if (!selectedAppId) return;
    await supabase.from("agent_vetting").update({ status: "needs_more_info", admin_notes: note }).eq("id", selectedAppId);
    setApplications((prev) =>
      prev.map((app) =>
        app.id === selectedAppId ? { ...app, admin_notes: note, status: "needs_more_info" } : app
      )
    );
    const app = applications.find((a) => a.id === selectedAppId);
    if (app) await sendStatusEmail(app, "needs_more_info", note);
    setShowModal(false);
    setSelectedAppId(null);
    setNote("");
  };

  if (loading) return <div>Loading applications...</div>;

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <h2 className="text-xl font-semibold mb-4 text-orange-600">Pending Applications</h2>
      {applications.length === 0 ? (
        <div className="text-gray-500">No applications found.</div>
      ) : (
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-teal-100">
              <th className="p-2">Name</th>
              <th className="p-2">Type</th>
              <th className="p-2">Status</th>
              <th className="p-2">Tier/Days</th>
              <th className="p-2">Admin Note</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr key={app.id} className="border-b">
                <td className="p-2">{app.first_name} {app.last_name}</td>
                <td className="p-2">{app.user_type}</td>
                <td className="p-2">{app.status}</td>
                <td className="p-2">
                  {app.user_type === "agent" ? app.tier : app.user_type === "fsbo" ? `${app.fsbo_days} days` : `${app.landlord_days} days`}
                </td>
                <td className="p-2 text-sm text-gray-700">{app.admin_notes || <span className="italic text-gray-400">No note</span>}</td>
                <td className="p-2">
                  {app.status === "approved" ? (
                    <a
                      href="#"
                      className="bg-green-500 text-white px-3 py-1 rounded mr-2 hover:bg-green-600 font-bold"
                    >
                      Proceed to Payment
                    </a>
                  ) : (
                    <>
                      <button className="bg-teal-500 text-white px-3 py-1 rounded mr-2 hover:bg-teal-600" onClick={() => handleApprove(app.id)}>Approve</button>
                      <button className="bg-orange-500 text-white px-3 py-1 rounded mr-2 hover:bg-orange-600" onClick={() => handleDeny(app.id)}>Deny</button>
                      <button className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600" onClick={() => handleMoreInfo(app.id)}>More Info</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-2 text-yellow-700">Request More Information</h3>
            <textarea
              className="w-full border rounded-lg p-2 mb-4"
              rows={4}
              placeholder="Enter note for applicant..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600" onClick={handleSaveNote}>Save Note</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
