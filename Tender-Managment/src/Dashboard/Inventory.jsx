// src/Dashboard/Inventory.jsx
import React, { useState } from "react";
import { supabase } from "../../Supabase/supabase";
import { Link } from "react-router-dom";

const BUCKET_NAME = "inventory-files";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

const Inventory = () => {
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
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

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
      setErrorMsg("Receipt file too large (max 10MB).");
      e.target.value = "";
      return;
    }
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
      setErrorMsg("Receipt file type not allowed. Use JPEG/PNG/WebP/PDF.");
      e.target.value = "";
      return;
    }
    setReceiptFile(file);
    setErrorMsg("");
  };

  const handlePhotosChange = (e) => {
    const files = Array.from(e.target.files || []);
    for (let f of files) {
      if (f.size > MAX_FILE_SIZE) {
        setErrorMsg(`Photo "${f.name}" too large (max 10MB).`);
        e.target.value = "";
        return;
      }
      if (!ALLOWED_PHOTO_TYPES.includes(f.type)) {
        setErrorMsg(`Photo "${f.name}" type not allowed.`);
        e.target.value = "";
        return;
      }
    }
    setPhotoFiles(files);
    setErrorMsg("");
  };

  const uploadFileToStorage = async (file, isReceipt = false) => {
    if (!file) return null;
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${timestamp}-${random}-${safeName}`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
    const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    if (!publicUrlData?.publicUrl) throw new Error("Failed to get public URL");
    return publicUrlData.publicUrl;
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
    const r = document.getElementById("receiptInput");
    const p = document.getElementById("photosInput");
    if (r) r.value = "";
    if (p) p.value = "";
  };

  const validatePhone = (phone) => {
    if (!phone) return true;
    return /^\d{10}$/.test(phone);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // Basic validation
      if (!form.material_name || !form.material_name.trim()) throw new Error("Material name is required.");
      if (!form.quantity || Number(form.quantity) <= 0) throw new Error("Quantity must be a positive number.");
      if (!form.unit || !form.unit.trim()) throw new Error("Unit is required.");
      if (!validatePhone(form.contact_phone)) throw new Error("Contact phone must be 10 digits when provided.");

      // Ensure authenticated user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn("getUser error:", userError);
      }
      const currentUserId = userData?.user?.id ?? null;
      if (!currentUserId) {
        throw new Error("You must be signed in to add inventory. Please log in and try again.");
      }

      // Upload files
      let receiptUrl = null;
      if (receiptFile) receiptUrl = await uploadFileToStorage(receiptFile, true);

      let photoUrls = [];
      if (photoFiles?.length > 0) {
        const arr = await Promise.all(photoFiles.map((f) => uploadFileToStorage(f, false)));
        photoUrls = arr.filter(Boolean);
      }

      // Build payload
      const payload = {
        movement_type: form.movement_type || "IN",
        transaction_date: form.transaction_date ? new Date(form.transaction_date).toISOString() : new Date().toISOString(),
        material_name: form.material_name.trim(),
        size_spec: form.size_spec ? form.size_spec.trim() : null,
        quantity: Number(form.quantity),
        unit: form.unit ? form.unit.trim() : null,
        issuer_dispatcher: form.issuer_dispatcher ? form.issuer_dispatcher.trim() : null,
        vehicle_number: form.vehicle_number ? form.vehicle_number.trim() : null,
        driver_name: form.driver_name ? form.driver_name.trim() : null,
        source_location: form.source_location ? form.source_location.trim() : null,
        destination_location: form.destination_location ? form.destination_location.trim() : null,
        stock_location: form.stock_location ? form.stock_location.trim() : null,
        contact_person: form.contact_person ? form.contact_person.trim() : null,
        contact_phone: form.contact_phone ? form.contact_phone.trim() : null,
        remarks: form.remarks ? form.remarks.trim() : null,
        purchase_price: form.purchase_price !== "" ? Number(form.purchase_price) : null,
        receipt_url: receiptUrl,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
        created_by: currentUserId, // mandatory owner field (must match RLS)
      };

      // Insert
      const { data: insertData, error: insertError } = await supabase
        .from("inventory_logs")
        .insert([payload])
        .select();

      if (insertError) {
        console.error("Insert error:", insertError);
        // helpful message for common mistakes
        if (insertError.code === "42P01" || (insertError.message && insertError.message.includes("relation"))) {
          throw new Error('Database table "inventory_logs" not found. Run the SQL migration in Supabase SQL editor.');
        }
        throw new Error(insertError.message || "Failed to insert inventory log");
      }

      setSuccessMsg(`Inventory saved ✓ (ID: ${insertData?.[0]?.id || "saved"})`);
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
      setErrorMsg(err?.message || "Failed to save inventory. Check console.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6 border-b pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">Inventory – Add Stock Movement</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Log incoming (IN) or outgoing (OUT) stock with details.</p>
          </div>
          <Link to="/inventory-list" className="text-xs md:text-sm text-blue-600 hover:underline">← View Inventory History</Link>
        </div>

        <div className="mb-4 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
          <strong>Setup:</strong> Create Storage bucket <code>{BUCKET_NAME}</code> and run DB migration SQL. See README.
        </div>

        {successMsg && <div className="mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md px-3 py-2">{successMsg}</div>}
        {errorMsg && <div className="mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* form fields (same as original) */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Movement Type</label>
              <select name="movement_type" value={form.movement_type} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm">
                <option value="IN">IN (Add Stocks)</option>
                <option value="OUT">OUT (Release Stocks)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Add / Release Stocks</label>
              <input type="datetime-local" name="transaction_date" value={form.transaction_date} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
              <p className="text-[11px] text-gray-400 mt-1">Leave empty to use current server time.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
              <input type="text" name="material_name" value={form.material_name} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. Cement Bag" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input type="text" name="size_spec" value={form.size_spec} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 50kg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" name="quantity" value={form.quantity} onChange={handleChange} required min="0" step="0.01" className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. 100" />
            </div>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <input type="text" name="unit" value={form.unit} onChange={handleChange} required className="w-full border rounded-md px-3 py-2 text-sm" placeholder="e.g. kg" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuer / Dispatcher</label>
              <input type="text" name="issuer_dispatcher" value={form.issuer_dispatcher} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
              <input type="text" name="vehicle_number" value={form.vehicle_number} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Driver's Name</label>
              <input type="text" name="driver_name" value={form.driver_name} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source (From)</label>
              <input type="text" name="source_location" value={form.source_location} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination (To)</label>
              <input type="text" name="destination_location" value={form.destination_location} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Material Location</label>
              <input type="text" name="stock_location" value={form.stock_location} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
              <input type="text" name="contact_person" value={form.contact_person} onChange={handleChange} className="w-full border rounded-md px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (10 digits)</label>
              <input type="tel" name="contact_phone" value={form.contact_phone} onChange={handleChange} maxLength={10} inputMode="numeric" pattern="\d{10}" className="w-full border rounded-md px-3 py-2 text-sm" />
              <p className="text-[11px] text-gray-400 mt-1">Leave empty if not available. 10 digits required if provided.</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (Total)</label>
            <input type="number" name="purchase_price" value={form.purchase_price} onChange={handleChange} min="0" step="0.01" className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <textarea name="remarks" value={form.remarks} onChange={handleChange} rows={3} className="w-full border rounded-md px-3 py-2 text-sm" />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Corresponding Receipt (PDF/Image)</label>
              <input id="receiptInput" type="file" accept="image/*,.pdf" onChange={handleReceiptChange} className="w-full text-sm" />
              <p className="text-[11px] text-gray-400 mt-1">This file will be uploaded to Supabase Storage.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Photos (Multiple allowed)</label>
              <input id="photosInput" type="file" accept="image/*" multiple onChange={handlePhotosChange} className="w-full text-sm" />
              <p className="text-[11px] text-gray-400 mt-1">All selected photos will be uploaded and stored.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" disabled={loading} onClick={resetForm} className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50">Reset</button>
            <button type="submit" disabled={loading} className="px-5 py-2 text-sm rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? "Saving..." : "Save Inventory Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
