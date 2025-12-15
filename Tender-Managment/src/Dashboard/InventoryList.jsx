// src/Dashboard/InventoryList.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../Supabase/supabase";
import { 
  Search, 
  Plus, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  MoreVertical, 
  Download,
  Calendar,
  Package,
  ArrowLeft,
  RefreshCw,
  Edit2,
  X,
  Save,
  UploadCloud
} from "lucide-react";

// Edit Modal Component (Internal)
const EditModal = ({ row, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({ ...row });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("inventory_logs")
        .update({
          material_name: formData.material_name,
          quantity: formData.quantity,
          unit: formData.unit,
          movement_type: formData.movement_type,
          remarks: formData.remarks
        })
        .eq("id", row.id);

      if (error) throw error;
      onUpdate(formData);
      onClose();
    } catch (err) {
      alert("Failed to update: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800">Edit Record #{row.id}</h3>
          <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Material Name</label>
            <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
              value={formData.material_name} onChange={e => setFormData({...formData, material_name: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Quantity</label>
              <input type="number" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Unit</label>
              <input className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
                value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Movement Type</label>
            <select className="w-full p-2 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 outline-none"
              value={formData.movement_type} onChange={e => setFormData({...formData, movement_type: e.target.value})}>
              <option value="IN">Stock IN</option>
              <option value="OUT">Stock OUT</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Remarks</label>
            <textarea rows={2} className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none" 
              value={formData.remarks || ""} onChange={e => setFormData({...formData, remarks: e.target.value})} />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const InventoryList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, IN, OUT
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: logs, error } = await supabase
        .from("inventory_logs")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setData(logs || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this record permanently?")) return;
    try {
      const { error } = await supabase.from("inventory_logs").delete().eq("id", id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      alert("Error deleting: " + err.message);
    }
  };

  // Filter Logic
  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.issuer_dispatcher?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id?.toString().includes(searchTerm);
    
    const matchesType = filterType === "ALL" || item.movement_type === filterType;
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute:"2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Inventory Records</h1>
              <p className="text-slate-500 text-sm">Manage and track all stock movements</p>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition" title="Refresh">
               <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
             </button>
             <Link to="/inventory" className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition">
               <Plus size={20} /> <span className="hidden sm:inline">Add New Record</span>
             </Link>
          </div>
        </div>

        {/* Filters & Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search */}
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search by material, issuer, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filter Types */}
          <div className="flex w-full md:w-auto bg-slate-50 p-1 rounded-xl border border-slate-200">
            {["ALL", "IN", "OUT"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 md:flex-none px-6 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filterType === type 
                    ? "bg-white text-blue-600 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 space-y-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Loading records...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredData.length === 0 && (
            <div className="flex flex-col items-center justify-center h-80 text-center px-4">
              <div className="bg-slate-50 p-4 rounded-full mb-4">
                <Package size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">No records found</h3>
              <p className="text-slate-400 text-sm max-w-xs mt-1">
                We couldn't find any inventory logs matching your search criteria.
              </p>
            </div>
          )}

          {/* Table View (Desktop) */}
          {!loading && filteredData.length > 0 && (
            <>
              <table className="hidden md:table w-full text-left border-collapse">
                <thead className="bg-slate-50/50 text-slate-500 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Material Details</th>
                    <th className="px-6 py-4">Logistics</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Attachments</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                          item.movement_type === "IN" 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-orange-50 text-orange-700 border-orange-100"
                        }`}>
                          {item.movement_type === "IN" ? <ArrowDownLeft size={12}/> : <ArrowUpRight size={12}/>}
                          {item.movement_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-800">{item.material_name}</span>
                          <span className="text-xs text-slate-500">
                            Qty: <span className="font-medium text-slate-700">{item.quantity} {item.unit}</span>
                          </span>
                          {item.size_spec && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">{item.size_spec}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col text-sm">
                          <span className="text-slate-700">{item.issuer_dispatcher || "N/A"}</span>
                          <span className="text-xs text-slate-400">{item.vehicle_number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-500 text-sm">
                          <span>{formatDate(item.created_at).split(",")[0]}</span>
                          <span className="text-xs bg-slate-100 px-1.5 rounded">{formatDate(item.created_at).split(",")[1]}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {item.receipt_url ? (
                            <a href={item.receipt_url} target="_blank" rel="noreferrer" className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition" title="View Receipt">
                              <FileText size={16} />
                            </a>
                          ) : (
                             <span className="p-1.5 bg-slate-50 text-slate-300 rounded-lg"><FileText size={16} /></span>
                          )}
                          {item.photo_urls && item.photo_urls.length > 0 ? (
                            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg relative group/tooltip cursor-help">
                              <ImageIcon size={16} />
                              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-purple-600 text-[8px] text-white">
                                {item.photo_urls.length}
                              </span>
                            </div>
                          ) : (
                             <span className="p-1.5 bg-slate-50 text-slate-300 rounded-lg"><ImageIcon size={16} /></span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingItem(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Card View (Mobile) */}
              <div className="md:hidden divide-y divide-slate-100">
                {filteredData.map((item) => (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         <div className={`mt-1 p-2 rounded-xl h-fit ${item.movement_type === "IN" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                             {item.movement_type === "IN" ? <ArrowDownLeft size={18}/> : <ArrowUpRight size={18}/>}
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-800">{item.material_name}</h4>
                             <p className="text-sm font-medium text-slate-600">{item.quantity} {item.unit}</p>
                             <p className="text-xs text-slate-400 mt-0.5">{formatDate(item.created_at)}</p>
                         </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingItem(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg"><Edit2 size={18}/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-slate-50 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 grid grid-cols-2 gap-y-2 gap-x-4 text-xs text-slate-500">
                       <div>
                         <span className="block text-[10px] uppercase text-slate-400 font-semibold">Issuer / Dispatcher</span>
                         {item.issuer_dispatcher || "-"}
                       </div>
                       <div>
                         <span className="block text-[10px] uppercase text-slate-400 font-semibold">Vehicle No</span>
                         {item.vehicle_number || "-"}
                       </div>
                       <div className="col-span-2">
                         <span className="block text-[10px] uppercase text-slate-400 font-semibold">Remarks</span>
                         {item.remarks || "No remarks"}
                       </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                       {item.receipt_url && (
                          <a href={item.receipt_url} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-100 transition">
                             <FileText size={14} /> View Receipt
                          </a>
                       )}
                       {item.photo_urls?.length > 0 && (
                          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-50 text-purple-700 text-xs font-medium rounded-lg">
                             <ImageIcon size={14} /> {item.photo_urls.length} Photos
                          </div>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        
        {/* Pagination Footer (Static for now) */}
        {!loading && filteredData.length > 0 && (
           <div className="text-center text-xs text-slate-400 pb-4">
              Showing all {filteredData.length} records
           </div>
        )}

      </div>

      {/* Edit Modal Render */}
      {editingItem && (
        <EditModal 
          row={editingItem} 
          onClose={() => setEditingItem(null)} 
          onUpdate={(updatedRow) => {
             setData(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...updatedRow } : item));
          }}
        />
      )}
    </div>
  );
};

export default InventoryList;