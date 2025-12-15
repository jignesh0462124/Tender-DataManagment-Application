// src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../Supabase/supabase";
import { getUserData } from "./User";
import { 
  LayoutDashboard, 
  Package, 
  History, 
  LogOut, 
  Menu, 
  X, 
  Plus, 
  Search, 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownLeft,
  FileText,
  Image as ImageIcon,
  MoreVertical,
  Trash2,
  Edit2
} from "lucide-react";

// Constants
const BUCKET_NAME = "inventory-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const HISTORY_LIMIT = 20; // Increased limit for better visibility

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ name: "Guest", role: "Viewer", avatar: "" });
  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Edit modal state
  const [editingRow, setEditingRow] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [newPhotoFiles, setNewPhotoFiles] = useState([]);

  // Realtime ref
  const realtimeChannelRef = useRef(null);

  useEffect(() => {
    loadDashboard();
    setupRealtime();
    return () => teardownRealtime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter data when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(historyData);
    } else {
      const lower = searchTerm.toLowerCase();
      setFilteredData(
        historyData.filter(
          (item) =>
            item.material_name?.toLowerCase().includes(lower) ||
            item.issuer_dispatcher?.toLowerCase().includes(lower) ||
            String(item.id).includes(lower)
        )
      );
    }
  }, [searchTerm, historyData]);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");
      const userData = await getUserData();
      if (userData) setUser(userData);

      const { data, error: fetchError } = await supabase
        .from("inventory_logs")
        .select("*") // fetching all columns for edit
        .order("created_at", { ascending: false })
        .limit(HISTORY_LIMIT);

      if (fetchError) throw fetchError;
      
      setHistoryData(data || []);
      setFilteredData(data || []);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  function setupRealtime() {
    if (realtimeChannelRef.current) return;
    const channel = supabase
      .channel("public:inventory_logs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "inventory_logs" }, (payload) => {
        setHistoryData((prev) => [payload.new, ...prev].slice(0, HISTORY_LIMIT));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "inventory_logs" }, (payload) => {
        setHistoryData((prev) => prev.map((r) => (r.id === payload.new.id ? payload.new : r)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "inventory_logs" }, (payload) => {
        setHistoryData((prev) => prev.filter((r) => r.id !== payload.old.id));
      })
      .subscribe();
    realtimeChannelRef.current = channel;
  }

  function teardownRealtime() {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Are you sure you want to delete ${row.material_name}?`)) return;
    try {
      const { error } = await supabase.from("inventory_logs").delete().eq("id", row.id);
      if (error) throw error;
      setHistoryData((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  // --- File Upload & Modal Logic ---
  const openEdit = (row) => {
    setModalError("");
    setReceiptFile(null);
    setNewPhotoFiles([]);
    setEditingRow({ ...row });
  };

  const uploadFile = async (file) => {
    if (!file) return null;
    if (file.size > MAX_FILE_SIZE) throw new Error("File too large (>10MB).");
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(key, file);
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(key);
    return data.publicUrl;
  };

  const handleModalSave = async (e) => {
    e.preventDefault();
    if (!editingRow) return;
    setModalLoading(true);
    setModalError("");

    try {
      let receipt_url = editingRow.receipt_url;
      if (receiptFile) receipt_url = await uploadFile(receiptFile);

      let photo_urls = editingRow.photo_urls || [];
      if (newPhotoFiles.length > 0) {
        const newUrls = await Promise.all(newPhotoFiles.map(uploadFile));
        photo_urls = [...photo_urls, ...newUrls];
      }

      const { data, error } = await supabase
        .from("inventory_logs")
        .update({
          ...editingRow,
          receipt_url,
          photo_urls,
          quantity: Number(editingRow.quantity), // Ensure number
        })
        .eq("id", editingRow.id)
        .select()
        .single();

      if (error) throw error;

      setHistoryData((prev) => prev.map((r) => (r.id === data.id ? data : r)));
      setEditingRow(null);
    } catch (err) {
      setModalError(err.message || "Failed to update.");
    } finally {
      setModalLoading(false);
    }
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  // --- UI Components ---

  // Sidebar Component
  const Sidebar = ({ mobile }) => (
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${mobile ? "w-64" : "w-64 hidden md:flex"}`}>
      <div className="px-6 py-6 border-b border-gray-200 flex items-center gap-3">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <LayoutDashboard className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-none">Osaioriginal</h1>
          <p className="text-xs text-gray-500 mt-1">Inventory Manager</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-50 text-blue-700 font-medium text-sm">
          <LayoutDashboard size={18} /> Dashboard
        </div>
        <Link to="/inventory" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm transition">
          <Package size={18} /> Inventory
        </Link>
        <Link to="/inventory-list" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 font-medium text-sm transition">
          <History size={18} /> History
        </Link>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user.avatar ? (
            <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full bg-gray-200 object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user.name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-xs text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition font-medium">
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
          <div className="relative z-50 h-full shadow-xl animate-in slide-in-from-left duration-200">
             <Sidebar mobile />
             <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-[-3rem] p-2 bg-white rounded-full text-gray-600 shadow-lg">
               <X size={20} />
             </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Menu size={24} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Dashboard</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/inventory" className="hidden md:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm">
              <Plus size={16} /> Add Inventory
            </Link>
            <Link to="/inventory" className="md:hidden flex items-center justify-center w-9 h-9 bg-blue-600 text-white rounded-lg shadow-sm">
              <Plus size={20} />
            </Link>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <p className="text-xs text-gray-500 font-medium uppercase">Recent Activity</p>
                 <h3 className="text-2xl font-bold text-gray-900 mt-1">{loading ? "..." : historyData.length}</h3>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <p className="text-xs text-gray-500 font-medium uppercase">Total IN</p>
                 <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                    {loading ? "..." : historyData.filter(i => i.movement_type === "IN").length}
                 </h3>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                 <p className="text-xs text-gray-500 font-medium uppercase">Total OUT</p>
                 <h3 className="text-2xl font-bold text-orange-600 mt-1">
                    {loading ? "..." : historyData.filter(i => i.movement_type === "OUT").length}
                 </h3>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-xl shadow-md text-white flex flex-col justify-between">
                 <p className="text-xs text-blue-100 font-medium uppercase">Quick Action</p>
                 <Link to="/inventory" className="text-sm font-semibold flex items-center gap-1 mt-2 hover:underline">
                    New Entry <ArrowUpRight size={16} />
                 </Link>
              </div>
            </div>

            {/* Main Data Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
              {/* Toolbar */}
              <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search material, ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
                <button 
                  onClick={loadDashboard}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition"
                >
                  <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> 
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {/* Table (Desktop) & Cards (Mobile) */}
              <div className="min-h-[300px]">
                {loading ? (
                  <div className="p-8 space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>)}
                  </div>
                ) : filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Package size={48} className="mb-3 opacity-20" />
                    <p>No records found</p>
                  </div>
                ) : (
                  <>
                    {/* Desktop View */}
                    <table className="hidden md:table w-full text-left text-sm">
                      <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
                        <tr>
                          <th className="px-6 py-3">Type</th>
                          <th className="px-6 py-3">Material</th>
                          <th className="px-6 py-3">Qty</th>
                          <th className="px-6 py-3">Issuer/To</th>
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredData.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50/80 transition group">
                            <td className="px-6 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                item.movement_type === "IN" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                              }`}>
                                {item.movement_type === "IN" ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                                {item.movement_type}
                              </span>
                            </td>
                            <td className="px-6 py-3 font-medium text-gray-900">{item.material_name}</td>
                            <td className="px-6 py-3 text-gray-600">{item.quantity} {item.unit}</td>
                            <td className="px-6 py-3 text-gray-500 max-w-[150px] truncate">{item.issuer_dispatcher || "-"}</td>
                            <td className="px-6 py-3 text-gray-400 text-xs">{formatDate(item.created_at)}</td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={16}/></button>
                                <button onClick={() => handleDelete(item)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile View (Cards) */}
                    <div className="md:hidden divide-y divide-gray-100">
                      {filteredData.map((item) => (
                        <div key={item.id} className="p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <div className={`mt-1 p-2 rounded-lg ${item.movement_type === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                                    {item.movement_type === "IN" ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{item.material_name}</h4>
                                    <p className="text-sm text-gray-500">{item.quantity} {item.unit} • {formatDate(item.created_at)}</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openEdit(item)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={18}/></button>
                                <button onClick={() => handleDelete(item)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18}/></button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                             <div>
                                <span className="block text-gray-400">Issuer/Dispatcher</span>
                                {item.issuer_dispatcher || "N/A"}
                             </div>
                             <div>
                                <span className="block text-gray-400">Destination/Stock</span>
                                {item.destination_location || item.stock_location || "N/A"}
                             </div>
                          </div>

                          <div className="flex gap-3">
                             {item.receipt_url && (
                                <a href={item.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded">
                                   <FileText size={12} /> Receipt
                                </a>
                             )}
                             {item.photo_urls?.length > 0 && (
                                <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                   <ImageIcon size={12} /> {item.photo_urls.length} Photos
                                </span>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Modal */}
      {editingRow && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
               <h3 className="font-bold text-gray-800">Edit Inventory Record</h3>
               <button onClick={() => setEditingRow(null)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleModalSave} className="overflow-y-auto p-6 space-y-4">
              {modalError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{modalError}</div>}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Material Name</label>
                    <input required className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition" 
                           value={editingRow.material_name} 
                           onChange={e => setEditingRow({...editingRow, material_name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Quantity</label>
                        <input required type="number" className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition" 
                            value={editingRow.quantity} 
                            onChange={e => setEditingRow({...editingRow, quantity: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 uppercase">Unit</label>
                        <input className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition" 
                            value={editingRow.unit} 
                            onChange={e => setEditingRow({...editingRow, unit: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Movement Type</label>
                    <select className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition bg-white"
                        value={editingRow.movement_type}
                        onChange={e => setEditingRow({...editingRow, movement_type: e.target.value})}>
                        <option value="IN">Stock IN</option>
                        <option value="OUT">Stock OUT</option>
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-500 uppercase">Issuer / Dispatcher</label>
                    <input className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition" 
                        value={editingRow.issuer_dispatcher || ""} 
                        onChange={e => setEditingRow({...editingRow, issuer_dispatcher: e.target.value})} />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-semibold text-gray-500 uppercase">Remarks</label>
                 <textarea rows={3} className="w-full p-2 border border-gray-300 rounded-lg outline-none focus:border-blue-500 transition" 
                    value={editingRow.remarks || ""} 
                    onChange={e => setEditingRow({...editingRow, remarks: e.target.value})} />
              </div>
              
              <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Receipt</label>
                    <input type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                        onChange={e => setReceiptFile(e.target.files?.[0])} />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Add Photos</label>
                    <input type="file" multiple className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
                        onChange={e => setNewPhotoFiles(Array.from(e.target.files || []))} />
                 </div>
              </div>

            </form>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end gap-3">
               <button onClick={() => setEditingRow(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
               <button onClick={handleModalSave} disabled={modalLoading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {modalLoading ? "Saving..." : "Save Changes"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}