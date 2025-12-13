// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../Supabase/supabase"; // adjust path if needed
import { getUserData } from "./User"; // same folder as this file

// Constants
const BUCKET_NAME = "inventory-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const HISTORY_LIMIT = 8; // how many recent rows to display

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: "Guest", role: "Viewer", avatar: "" });
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState("");

  // Edit modal state (kept inline inside Dashboard)
  const [editingRow, setEditingRow] = useState(null); // full row object
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);

  // keep channel ref so we can unsubscribe on unmount
  const realtimeChannelRef = useRef(null);

  useEffect(() => {
    loadDashboard();
    setupRealtime();
    return () => {
      teardownRealtime();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // initial load
  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const userData = await getUserData();
      if (userData) setUser(userData);

      const { data, error: fetchError } = await supabase
        .from("inventory_logs")
        .select(
          "id, movement_type, material_name, quantity, unit, issuer_dispatcher, created_at, receipt_url, photo_urls, created_by, transaction_date, remarks, purchase_price"
        )
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      if (fetchError) {
        console.error("Inventory history fetch error:", fetchError);
        setHistoryData([]);
        setError("Failed to fetch recent inventory.");
        return;
      }
      setHistoryData(data || []);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError("Unexpected error loading dashboard.");
    } finally {
      setLoading(false);
    }
  }

  // Setup realtime Postgres changes subscription
  function setupRealtime() {
    // remove if already exists
    if (realtimeChannelRef.current) return;

    const channel = supabase
      .channel("public:inventory_logs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "inventory_logs" },
        (payload) => {
          const newRow = payload.new;
          // prepend new row and trim to limit
          setHistoryData((prev) => {
            // prevent duplicates: if id exists, replace
            const exists = prev.some((r) => r.id === newRow.id);
            if (exists) return prev.map((r) => (r.id === newRow.id ? newRow : r));
            return [newRow, ...prev].slice(0, HISTORY_LIMIT);
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inventory_logs" },
        (payload) => {
          const updated = payload.new;
          setHistoryData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "inventory_logs" },
        (payload) => {
          const deleted = payload.old;
          setHistoryData((prev) => prev.filter((r) => r.id !== deleted.id));
        }
      )
      .subscribe((status) => {
        // optional: log subscription status for debugging
        // console.log("Realtime channel status:", status);
      });

    realtimeChannelRef.current = channel;
  }

  function teardownRealtime() {
    const channel = realtimeChannelRef.current;
    if (!channel) return;
    supabase.removeChannel(channel);
    realtimeChannelRef.current = null;
  }

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
    return `${typeText} ${log.quantity ?? ""} ${log.unit ?? ""} of ${log.material_name}`;
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Inline delete (RLS will enforce owner-only)
  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete inventory record #${row.id} (${row.material_name})? This cannot be undone.`);
    if (!ok) return;
    try {
      const { error: delErr } = await supabase.from("inventory_logs").delete().eq("id", row.id);
      if (delErr) {
        console.error("Delete error:", delErr);
        alert("Delete failed: " + delErr.message);
        return;
      }
      setHistoryData((prev) => prev.filter((r) => r.id !== row.id));
      alert("Record deleted.");
    } catch (err) {
      console.error("Unexpected delete error:", err);
      alert("Delete failed.");
    }
  };

  // Open edit modal by copying the row object (so we can edit locally)
  const openEdit = (row) => {
    setModalError("");
    setReceiptFile(null);
    setNewPhotoFiles([]);
    // Clone to avoid mutating original list until saved
    setEditingRow({ ...row });
  };

  // File upload helper used by modal
  const uploadFile = async (file) => {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) throw new Error("File too large (>10MB).");
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${timestamp}-${Math.random().toString(36).slice(2, 6)}-${safeName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(key, file, { upsert: false });
    if (uploadError) {
      console.error("storage upload error:", uploadError);
      throw uploadError;
    }
    const { data: urlData, error: urlErr } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);
    if (urlErr) {
      console.warn("getPublicUrl error:", urlErr);
      throw urlErr;
    }
    return urlData?.publicUrl ?? null;
  };

  // Save changes from modal (update DB)
  const handleModalSave = async (e) => {
    e && e.preventDefault();
    if (!editingRow) return;
    setModalLoading(true);
    setModalError("");

    try {
      // Upload receipt if replaced
      let receipt_url = editingRow.receipt_url ?? null;
      if (receiptFile) {
        receipt_url = await uploadFile(receiptFile);
      }

      // Append new photos
      let photo_urls = Array.isArray(editingRow.photo_urls) ? [...editingRow.photo_urls] : [];
      if (newPhotoFiles.length > 0) {
        const uploaded = await Promise.all(
          newPhotoFiles.map((f) =>
            uploadFile(f).catch((err) => {
              console.error("photo upload error:", err);
              return null;
            })
          )
        );
        const okUrls = uploaded.filter(Boolean);
        photo_urls = [...photo_urls, ...okUrls];
      }

      // Prepare payload (only writable fields)
      const payload = {
        movement_type: editingRow.movement_type,
        transaction_date: editingRow.transaction_date,
        material_name: editingRow.material_name,
        size_spec: editingRow.size_spec,
        quantity: Number(editingRow.quantity),
        unit: editingRow.unit,
        issuer_dispatcher: editingRow.issuer_dispatcher,
        vehicle_number: editingRow.vehicle_number,
        driver_name: editingRow.driver_name,
        source_location: editingRow.source_location,
        destination_location: editingRow.destination_location,
        stock_location: editingRow.stock_location,
        contact_person: editingRow.contact_person,
        contact_phone: editingRow.contact_phone,
        remarks: editingRow.remarks,
        purchase_price: editingRow.purchase_price,
        receipt_url,
        photo_urls: photo_urls.length ? photo_urls : null,
      };

      const { data: updated, error: updateErr } = await supabase
        .from("inventory_logs")
        .update(payload)
        .eq("id", editingRow.id)
        .select()
        .single();

      if (updateErr) {
        console.error("Update error:", updateErr);
        setModalError(updateErr.message || "Failed to update record.");
        setModalLoading(false);
        return;
      }

      // Update local list (historyData)
      setHistoryData((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditingRow(null);
      setReceiptFile(null);
      setNewPhotoFiles([]);
      alert("Record updated.");
    } catch (err) {
      console.error("Save exception:", err);
      setModalError(err?.message || "Failed to save changes.");
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal and reset related state
  const closeModal = () => {
    setEditingRow(null);
    setModalError("");
    setModalLoading(false);
    setReceiptFile(null);
    setNewPhotoFiles([]);
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-6 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-800">Osaioriginal</h1>
          <p className="text-xs text-gray-500 mt-1">Tender &amp; Inventory Dashboard</p>
        </div>

        <nav className="px-4 py-4 space-y-1">
          <div className="flex items-center px-3 py-2 rounded-md bg-blue-50 text-blue-600 text-sm font-medium">
            <span>Dashboard</span>
          </div>

          <Link to="/inventory" className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100">
            Inventory
          </Link>

          <Link to="/inventory-list" className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-100">
            Inventory History
          </Link>
        </nav>

        <div className="mt-auto px-6 py-4 text-xs text-gray-400">© 2024 Osaioriginal</div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Dashboard</h2>

          {!loading && (
            <div className="flex items-center gap-3">
              {user.avatar && <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{user.name}</span>
                <span className="text-xs text-gray-500">{user.role}</span>
              </div>
              <button onClick={handleLogout} className="ml-2 text-xs px-3 py-1.5 rounded-md border border-red-500 text-red-500 hover:bg-red-50 transition">
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
                    Welcome back, <span className="text-blue-600">{user.name?.split(" ")[0]}</span>
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">Here&apos;s an overview of your recent inventory activity.</p>
                </div>

                <Link to="/inventory" className="inline-flex items-center justify-center px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium shadow-sm hover:bg-blue-700 transition">
                  Add Inventory
                </Link>
              </section>

              {error && <div className="mb-4 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</div>}

              {/* History Table */}
              <section className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-800">Recent Inventory History</h4>
                  <span className="text-xs text-gray-400">Last {historyData.length} movements</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-2 font-medium text-gray-600">ID</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Action</th>
                        <th className="px-4 py-2 font-medium text-gray-600">User / Issuer</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Date &amp; Time</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Files</th>
                        <th className="px-4 py-2 font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-4 text-center text-gray-400 text-sm">
                            No inventory movement recorded yet. Add your first entry from Inventory page.
                          </td>
                        </tr>
                      )}

                      {historyData.map((item) => (
                        <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-700">{item.id}</td>
                          <td className="px-4 py-2 text-gray-800">{buildActionText(item)}</td>
                          <td className="px-4 py-2 text-gray-600">{item.issuer_dispatcher || "—"}</td>
                          <td className="px-4 py-2 text-gray-500 text-xs">{formatDate(item.created_at)}</td>
                          <td className="px-4 py-2 text-gray-600">
                            {item.receipt_url && <a className="text-blue-600 underline mr-2" href={item.receipt_url} target="_blank" rel="noreferrer">Receipt</a>}
                            {item.photo_urls && item.photo_urls.length > 0 && <span className="text-gray-600 text-xs">{item.photo_urls.length} photo(s)</span>}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button onClick={() => openEdit(item)} className="px-2 py-1 text-sm bg-yellow-100 hover:bg-yellow-200 rounded">Edit</button>
                              <button onClick={() => handleDelete(item)} className="px-2 py-1 text-sm bg-red-100 hover:bg-red-200 rounded">Delete</button>
                            </div>
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

      {/* Inline Edit Modal (rendered here so EditInventoryModal component is not required) */}
      {editingRow && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/40">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Inventory #{editingRow.id}</h3>
              <button onClick={closeModal} className="text-sm px-2 py-1 rounded border">Close</button>
            </div>

            {modalError && <div className="mb-3 text-sm text-red-700 bg-red-50 p-2 rounded">{modalError}</div>}

            <form onSubmit={handleModalSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Material</label>
                  <input required className="w-full border px-2 py-1" value={editingRow.material_name} onChange={(e) => setEditingRow({ ...editingRow, material_name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Quantity</label>
                  <input required type="number" className="w-full border px-2 py-1" value={editingRow.quantity} onChange={(e) => setEditingRow({ ...editingRow, quantity: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Unit</label>
                  <input className="w-full border px-2 py-1" value={editingRow.unit || ""} onChange={(e) => setEditingRow({ ...editingRow, unit: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Movement Type</label>
                  <select className="w-full border px-2 py-1" value={editingRow.movement_type} onChange={(e) => setEditingRow({ ...editingRow, movement_type: e.target.value })}>
                    <option value="IN">IN</option>
                    <option value="OUT">OUT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600">Issuer / Dispatcher</label>
                <input className="w-full border px-2 py-1" value={editingRow.issuer_dispatcher || ""} onChange={(e) => setEditingRow({ ...editingRow, issuer_dispatcher: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600">Contact Person</label>
                  <input className="w-full border px-2 py-1" value={editingRow.contact_person || ""} onChange={(e) => setEditingRow({ ...editingRow, contact_person: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600">Contact Phone</label>
                  <input className="w-full border px-2 py-1" value={editingRow.contact_phone || ""} onChange={(e) => setEditingRow({ ...editingRow, contact_phone: e.target.value })} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600">Remarks</label>
                <textarea className="w-full border px-2 py-1" rows={3} value={editingRow.remarks || ""} onChange={(e) => setEditingRow({ ...editingRow, remarks: e.target.value })} />
              </div>

              <div>
                <label className="block text-xs text-gray-600">Replace Receipt (optional)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)} />
                {editingRow.receipt_url && <div className="text-xs mt-1"><a href={editingRow.receipt_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">View current receipt</a></div>}
              </div>

              <div>
                <label className="block text-xs text-gray-600">Add Photos (optional)</label>
                <input type="file" multiple accept="image/*" onChange={(e) => setNewPhotoFiles(Array.from(e.target.files || []))} />
                {editingRow.photo_urls && editingRow.photo_urls.length > 0 && (
                  <div className="mt-1 text-xs">Existing: {editingRow.photo_urls.length} photo(s). New photos will be appended.</div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button type="button" onClick={closeModal} className="px-3 py-1 border rounded">Cancel</button>
                <button type="submit" disabled={modalLoading} className="px-4 py-1 bg-blue-600 text-white rounded">
                  {modalLoading ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
