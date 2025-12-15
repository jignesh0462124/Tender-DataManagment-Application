// src/Dashboard/Inventory.jsx
import React, { useState, useRef } from "react";
import { supabase } from "../../Supabase/supabase";
import { Link } from "react-router-dom";
import { 
  Package, 
  Calendar, 
  Truck, 
  MapPin, 
  User, 
  Phone, 
  FileText, 
  UploadCloud, 
  Save, 
  ArrowLeft, 
  DollarSign, 
  Info,
  Layers,
  Map,
  X,
  CheckCircle,
  AlertCircle
} from "lucide-react";

const BUCKET_NAME = "inventory-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const Inventory = () => {
  // Refs for clearing file inputs manually
  const receiptInputRef = useRef(null);
  const photosInputRef = useRef(null);

  const [form, setForm] = useState({
    movement_type: "IN",
    transaction_date: "",
    material_name: "",
    size_spec: "",
    quantity: "",
    unit: "",
    issuer_dispatcher: "",
    vehicle_number: "",
    driver_name: "",
    source_location: "",
    destination_location: "",
    stock_location: "",
    contact_person: "",
    contact_phone: "",
    remarks: "",
    purchase_price: "",
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]); // For image thumbnails
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" }); // Unified status state

  // --- Handlers ---

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "contact_phone") {
      const digits = value.replace(/\D/g, "").slice(0, 10);
      setForm((p) => ({ ...p, [name]: digits }));
    } else {
      setForm((p) => ({ ...p, [name]: value }));
    }
  };

  const handleReceiptChange = (e) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setReceiptFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setStatus({ type: "error", msg: "Receipt file too large (max 10MB)." });
      e.target.value = "";
      return;
    }
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setStatus({ type: "error", msg: "Invalid file type. Use JPEG/PNG/PDF." });
      e.target.value = "";
      return;
    }
    setReceiptFile(file);
    setStatus({ type: "", msg: "" });
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = [];
    const newPreviews = [];

    for (let f of files) {
      if (f.size > MAX_FILE_SIZE) {
        setStatus({ type: "error", msg: `Photo "${f.name}" too large.` });
        return;
      }
      if (!ALLOWED_PHOTO_TYPES.includes(f.type)) {
        setStatus({ type: "error", msg: `Photo "${f.name}" type not allowed.` });
        return;
      }
      validFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }

    setPhotoFiles(validFiles);
    setPhotoPreviews(newPreviews);
    setStatus({ type: "", msg: "" });
  };

  // Helper: Get Current Location
  const handleGetLocation = (fieldName) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        setForm((prev) => ({ ...prev, [fieldName]: coords }));
      },
      () => {
        alert("Unable to retrieve your location.");
      }
    );
  };

  const uploadFileToStorage = async (file) => {
    if (!file) return null;
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${timestamp}-${random}-${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw new Error(`Upload failed: ${error.message}`);
    
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    return data.publicUrl;
  };

  const resetForm = () => {
    setForm({
      movement_type: "IN",
      transaction_date: "",
      material_name: "",
      size_spec: "",
      quantity: "",
      unit: "",
      issuer_dispatcher: "",
      vehicle_number: "",
      driver_name: "",
      source_location: "",
      destination_location: "",
      stock_location: "",
      contact_person: "",
      contact_phone: "",
      remarks: "",
      purchase_price: "",
    });
    setReceiptFile(null);
    setPhotoFiles([]);
    setPhotoPreviews([]);
    if (receiptInputRef.current) receiptInputRef.current.value = "";
    if (photosInputRef.current) photosInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", msg: "" });

    try {
      // Validation
      if (!form.material_name.trim()) throw new Error("Material name is required.");
      if (!form.quantity || Number(form.quantity) <= 0) throw new Error("Quantity must be positive.");
      if (!form.unit.trim()) throw new Error("Unit is required.");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error("You must be signed in.");

      // Uploads
      let receiptUrl = null;
      if (receiptFile) receiptUrl = await uploadFileToStorage(receiptFile);

      let photoUrls = [];
      if (photoFiles.length > 0) {
        photoUrls = await Promise.all(photoFiles.map((f) => uploadFileToStorage(f)));
      }

      // Payload
      const payload = {
        ...form,
        quantity: Number(form.quantity),
        purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
        transaction_date: form.transaction_date ? new Date(form.transaction_date).toISOString() : new Date().toISOString(),
        receipt_url: receiptUrl,
        photo_urls: photoUrls.length ? photoUrls : null,
        created_by: userData.user.id,
      };

      const { error } = await supabase.from("inventory_logs").insert([payload]);

      if (error) throw error;

      setStatus({ type: "success", msg: "Inventory Record Saved Successfully!" });
      resetForm();
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: err.message || "Failed to save inventory." });
    } finally {
      setLoading(false);
    }
  };

  // --- UI Components ---
  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-2 mb-4 border-b pb-2 text-slate-700">
      <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600">
        <Icon size={18} />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
  );

  const InputField = ({ label, icon: Icon, ...props }) => (
    <div className="w-full">
      <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">{label}</label>
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
          <Icon size={16} />
        </div>
        <input 
          {...props} 
          className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-6 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Inventory Management</h1>
            <p className="text-slate-500 mt-1">Record incoming and outgoing stock movements.</p>
          </div>
          <Link 
            to="/inventory-list" 
            className="flex items-center justify-center gap-2 bg-white text-slate-600 px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition shadow-sm font-medium text-sm"
          >
            <ArrowLeft size={16} /> View History
          </Link>
        </div>

        {/* Status Messages */}
        {status.msg && (
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 shadow-sm border ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium text-sm">{status.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative">
          
          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-slate-600 font-medium">Processing...</p>
            </div>
          )}

          <div className="p-6 md:p-8 space-y-8">
            
            {/* 1. Movement Details */}
            <section>
              <SectionHeader icon={Package} title="Movement Details" />
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Movement Type</label>
                   <div className="relative">
                      <Layers className="absolute left-3 top-3 text-slate-400" size={16} />
                      <select 
                        name="movement_type" 
                        value={form.movement_type} 
                        onChange={handleChange}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none"
                      >
                        <option value="IN">IN (Add Stock)</option>
                        <option value="OUT">OUT (Release Stock)</option>
                      </select>
                   </div>
                </div>
                <InputField type="datetime-local" label="Date & Time" name="transaction_date" value={form.transaction_date} onChange={handleChange} icon={Calendar} />
                
                <div className="md:col-span-2 grid md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <InputField type="text" label="Material Name" name="material_name" value={form.material_name} onChange={handleChange} icon={Package} placeholder="e.g. Cement, Steel Rods" required />
                  </div>
                  <InputField type="text" label="Size / Spec" name="size_spec" value={form.size_spec} onChange={handleChange} icon={Info} placeholder="e.g. 50kg bag" />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <InputField type="number" label="Quantity" name="quantity" value={form.quantity} onChange={handleChange} icon={Layers} placeholder="0.00" step="0.01" required />
                  <InputField type="text" label="Unit" name="unit" value={form.unit} onChange={handleChange} icon={Info} placeholder="kg, pcs, bags" required />
                </div>
                
                <InputField type="number" label="Total Value (Price)" name="purchase_price" value={form.purchase_price} onChange={handleChange} icon={DollarSign} placeholder="0.00" step="0.01" />
              </div>
            </section>

            {/* 2. Logistics */}
            <section>
              <SectionHeader icon={Truck} title="Logistics & Location" />
              <div className="grid md:grid-cols-2 gap-6">
                <InputField type="text" label="Issuer / Dispatcher" name="issuer_dispatcher" value={form.issuer_dispatcher} onChange={handleChange} icon={User} />
                <InputField type="text" label="Vehicle Number" name="vehicle_number" value={form.vehicle_number} onChange={handleChange} icon={Truck} placeholder="MH-XX-0000" />
                
                <div className="md:col-span-2">
                   <InputField type="text" label="Driver's Name" name="driver_name" value={form.driver_name} onChange={handleChange} icon={User} />
                </div>

                {/* Location with Geo-button */}
                <div className="md:col-span-2 grid md:grid-cols-3 gap-6">
                  <div className="relative">
                     <InputField type="text" label="Source (From)" name="source_location" value={form.source_location} onChange={handleChange} icon={MapPin} />
                     <button type="button" onClick={() => handleGetLocation('source_location')} className="absolute right-2 top-[30px] p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Use Current Location">
                        <Map size={16} />
                     </button>
                  </div>
                  <div className="relative">
                     <InputField type="text" label="Destination (To)" name="destination_location" value={form.destination_location} onChange={handleChange} icon={MapPin} />
                     <button type="button" onClick={() => handleGetLocation('destination_location')} className="absolute right-2 top-[30px] p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Use Current Location">
                        <Map size={16} />
                     </button>
                  </div>
                  <InputField type="text" label="Stock Location (Warehouse)" name="stock_location" value={form.stock_location} onChange={handleChange} icon={MapPin} />
                </div>
              </div>
            </section>

            {/* 3. Contact & Remarks */}
            <section>
              <SectionHeader icon={User} title="Contact & Remarks" />
              <div className="grid md:grid-cols-2 gap-6">
                 <InputField type="text" label="Contact Person" name="contact_person" value={form.contact_person} onChange={handleChange} icon={User} />
                 <InputField type="tel" label="Phone Number" name="contact_phone" value={form.contact_phone} onChange={handleChange} icon={Phone} placeholder="10-digit mobile" maxLength={10} />
                 
                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-600 mb-1.5 ml-1">Remarks</label>
                    <textarea 
                      name="remarks" 
                      rows={3} 
                      value={form.remarks} 
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      placeholder="Any additional notes..."
                    />
                 </div>
              </div>
            </section>

            {/* 4. Files */}
            <section>
              <SectionHeader icon={UploadCloud} title="Attachments" />
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* Receipt Upload */}
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-2">Receipt (PDF/Image)</label>
                   <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors text-center relative">
                      <input 
                        ref={receiptInputRef}
                        type="file" 
                        accept="image/*,.pdf" 
                        onChange={handleReceiptChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                         <div className="p-2 bg-white rounded-full shadow-sm">
                            <FileText size={20} className="text-blue-500"/>
                         </div>
                         <span className="text-sm text-slate-500">{receiptFile ? receiptFile.name : "Click or Drag to Upload"}</span>
                      </div>
                   </div>
                </div>

                {/* Photos Upload */}
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-2">Photos (Evidence)</label>
                   <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors text-center relative">
                      <input 
                        ref={photosInputRef}
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handlePhotosChange} 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                         <div className="p-2 bg-white rounded-full shadow-sm">
                            <UploadCloud size={20} className="text-purple-500"/>
                         </div>
                         <span className="text-sm text-slate-500">{photoFiles.length > 0 ? `${photoFiles.length} files selected` : "Upload Site Photos"}</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* Photo Previews */}
              {photoPreviews.length > 0 && (
                <div className="mt-4 flex gap-3 overflow-x-auto py-2">
                  {photoPreviews.map((src, i) => (
                    <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                       <img src={src} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Footer Actions */}
          <div className="bg-slate-50 p-6 flex flex-col-reverse md:flex-row justify-end gap-3 border-t border-slate-100">
            <button 
              type="button" 
              onClick={resetForm} 
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-white hover:text-slate-800 transition"
            >
              Reset Form
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              {loading ? "Saving..." : "Save Record"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Inventory;