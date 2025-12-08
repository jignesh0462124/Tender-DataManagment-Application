// src/pages/Inventory.jsx
import React, { useState } from "react";
import { supabase } from "../../Supabase/supabase"; // adjust if needed
import { Link } from "react-router-dom";

const BUCKET_NAME = "inventory-files"; // make sure this bucket exists

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
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReceiptChange = (e) => {
    setReceiptFile(e.target.files[0] || null);
  };

  const handlePhotosChange = (e) => {
    setPhotoFiles(Array.from(e.target.files || []));
  };

  const uploadFileToStorage = async (file) => {
    const filePath = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (error) {
      console.error("Upload error:", error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      // Upload receipt file
      let receiptUrl = null;
      if (receiptFile) {
        receiptUrl = await uploadFileToStorage(receiptFile);
      }

      // Upload photos
      let photoUrls = [];
      if (photoFiles.length > 0) {
        const promises = photoFiles.map((file) => uploadFileToStorage(file));
        photoUrls = await Promise.all(promises);
      }

      // Prepare payload
      const payload = {
        movement_type: form.movement_type,
        transaction_date: form.transaction_date
          ? new Date(form.transaction_date).toISOString()
          : undefined, // DB default if not provided
        material_name: form.material_name,
        size_spec: form.size_spec || null,
        quantity: form.quantity ? Number(form.quantity) : null,
        unit: form.unit,
        issuer_dispatcher: form.issuer_dispatcher || null,
        vehicle_number: form.vehicle_number || null,
        driver_name: form.driver_name || null,
        source_location: form.source_location || null,
        destination_location: form.destination_location || null,
        stock_location: form.stock_location || null,
        contact_person: form.contact_person || null,
        remarks: form.remarks || null,
        purchase_price: form.purchase_price
          ? Number(form.purchase_price)
          : null,
        receipt_url: receiptUrl,
        photo_urls: photoUrls.length > 0 ? photoUrls : null,
      };

      const { data, error } = await supabase
        .from("inventory_logs")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      console.log("Inserted row:", data);

      setSuccessMsg("Inventory log added successfully ✅");
      resetForm();
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to add inventory log. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-8 px-4">
      <div className="w-full max-w-5xl bg-white shadow-sm rounded-lg p-6">
        <div className="mb-6 border-b pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
              Inventory – Add Stock Movement
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Log incoming (IN) or outgoing (OUT) stock with full details.
            </p>
          </div>

          <Link
            to="/dashboard"
            className="text-xs md:text-sm text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {successMsg && (
          <div className="mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-md px-3 py-2">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-md px-3 py-2">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top Row: Movement Type + Date */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Movement Type
              </label>
              <select
                name="movement_type"
                value={form.movement_type}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="IN">IN (Add Stocks)</option>
                <option value="OUT">OUT (Release Stocks)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Add / Release Stocks
              </label>
              <input
                type="datetime-local"
                name="transaction_date"
                value={form.transaction_date}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Leave empty to use current server time.
              </p>
            </div>
          </div>

          {/* Material & Quantity */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material
              </label>
              <input
                type="text"
                name="material_name"
                value={form.material_name}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Cement Bag, Sand, Steel Rod"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <input
                type="text"
                name="size_spec"
                value={form.size_spec}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 50kg, 12mm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 100"
              />
            </div>
          </div>

          {/* Unit & Logistics */}
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                required
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. kg, pcs, bags"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issuer / Dispatcher
              </label>
              <input
                type="text"
                name="issuer_dispatcher"
                value={form.issuer_dispatcher}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Person responsible for issuing/dispatching"
              />
            </div>
          </div>

          {/* Vehicle, Driver */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vehicle Number
              </label>
              <input
                type="text"
                name="vehicle_number"
                value={form.vehicle_number}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. MH-31-AB-1234"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Driver&apos;s Name
              </label>
              <input
                type="text"
                name="driver_name"
                value={form.driver_name}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Ramesh Patil"
              />
            </div>
          </div>

          {/* Locations */}
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source (From)
              </label>
              <input
                type="text"
                name="source_location"
                value={form.source_location}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Supplier Yard"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination (To)
              </label>
              <input
                type="text"
                name="destination_location"
                value={form.destination_location}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Site A, Warehouse 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Material Location
              </label>
              <input
                type="text"
                name="stock_location"
                value={form.stock_location}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. Rack B-3, Godown 1"
              />
            </div>
          </div>

          {/* Contact + Price */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                type="text"
                name="contact_person"
                value={form.contact_person}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Name and phone if needed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purchase Price (Total)
              </label>
              <input
                type="number"
                name="purchase_price"
                value={form.purchase_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g. 15000.00"
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={form.remarks}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional notes about this movement..."
            />
          </div>

          {/* Files */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Corresponding Receipt (PDF/Image)
              </label>
              <input
                id="receiptInput"
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptChange}
                className="w-full text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                This file will be uploaded to Supabase Storage.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photos (Multiple allowed)
              </label>
              <input
                id="photosInput"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotosChange}
                className="w-full text-sm"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                All selected photos will be uploaded and stored.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={loading}
              onClick={resetForm}
              className="px-4 py-2 text-sm rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Inventory Log"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Inventory;
