// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase/supabase"; // adjust path if needed
import { getUserData } from "./User"; // same folder as this file

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({
    name: "Guest",
    role: "Viewer",
    avatar: "",
  });
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        // 1️⃣ Get user details
        const userData = await getUserData();
        if (userData) {
          setUser(userData);
        }

        // 2️⃣ Fetch recent inventory logs as history
        const { data, error } = await supabase
          .from("inventory_logs")
          .select(
            "id, movement_type, material_name, quantity, unit, issuer_dispatcher, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) {
          console.error("Inventory history fetch error:", error);
          setHistoryData([]);
          return;
        }

        setHistoryData(data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const buildActionText = (log) => {
    const typeText = log.movement_type === "OUT" ? "Released" : "Added";
    return `${typeText} ${log.quantity ?? ""} ${log.unit ?? ""} of ${
      log.material_name
    }`;
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">
            Osaioriginal
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Tender &amp; Inventory Dashboard
          </p>
        </div>

        <nav className="px-4 py-4 space-y-1">
          <div className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-600 text-sm font-medium">
            <span>Dashboard</span>
          </div>

          <Link
            to="/inventory"
            className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100"
          >
            Inventory
          </Link>
        </nav>

        <div className="mt-auto px-6 py-4 text-xs text-gray-400">
          © 2024 Osaioriginal
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>

          {!loading && (
            <div className="flex items-center gap-3">
              {user.avatar && (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover border border-gray-200"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">
                  {user.name}
                </span>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 text-xs px-3 py-1.5 rounded-md border border-red-500 text-red-500 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <p className="text-sm text-gray-500">Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* Welcome + Add Inventory */}
              <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Welcome back,{" "}
                    <span className="text-blue-600">
                      {user.name?.split(" ")[0]}
                    </span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Here&apos;s an overview of your recent inventory activity.
                  </p>
                </div>

                <Link
                  to="/inventory"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition"
                >
                  Add Inventory
                </Link>
              </section>

              {/* History Table */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800">
                    Recent Inventory History
                  </h4>
                  <span className="text-xs text-gray-400">
                    Last {historyData.length} movements
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-medium text-gray-600">
                          Action
                        </th>
                        <th className="px-4 py-2 font-medium text-gray-600">
                          User / Issuer
                        </th>
                        <th className="px-4 py-2 font-medium text-gray-600">
                          Date &amp; Time
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.length === 0 && (
                        <tr>
                          <td
                            colSpan="3"
                            className="px-4 py-4 text-center text-gray-400 text-sm"
                          >
                            No inventory movement recorded yet. Add your first
                            entry from Inventory page.
                          </td>
                        </tr>
                      )}

                      {historyData.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          <td className="px-4 py-2 text-gray-800">
                            {buildActionText(item)}
                          </td>
                          <td className="px-4 py-2 text-gray-600">
                            {item.issuer_dispatcher || "—"}
                          </td>
                          <td className="px-4 py-2 text-gray-500 text-xs">
                            {formatDate(item.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
