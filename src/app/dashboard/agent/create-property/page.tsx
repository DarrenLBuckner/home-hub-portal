
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// Drag-and-drop image upload helper
import { useRef } from "react";
function DragDropUpload({ images, setImages, mainImageIdx, setMainImageIdx }: {
  images: File[];
  setImages: (files: File[]) => void;
  mainImageIdx: number;
  setMainImageIdx: (idx: number) => void;
}) {
  const [dragActive, setDragActive] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // Drag-and-drop reordering logic
  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const newImages = [...images];
      const dragged = newImages.splice(dragItem.current, 1)[0];
      newImages.splice(dragOverItem.current, 0, dragged);
      setImages(newImages);
      // If main image was moved, update index
      if (mainImageIdx === dragItem.current) setMainImageIdx(dragOverItem.current);
      else if (mainImageIdx === dragOverItem.current) setMainImageIdx(dragItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center transition ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
      onDragOver={e => { e.preventDefault(); setDragActive(true); }}
      onDragLeave={e => { e.preventDefault(); setDragActive(false); }}
      onDrop={e => {
        e.preventDefault(); setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          setImages([...images, ...Array.from(e.dataTransfer.files)]);
        }
      }}
    >
      <p className="mb-2">Drag & drop images here, or click to select</p>
      <input type="file" multiple accept="image/*" className="hidden" id="property-images-upload" onChange={e => {
        if (e.target.files) setImages([...images, ...Array.from(e.target.files)]);
      }} />
      <label htmlFor="property-images-upload" className="cursor-pointer bg-blue-700 text-white px-4 py-2 rounded">Select Images</label>
      {images.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {images.map((img, idx) => (
            <div
              key={idx}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragEnter={() => handleDragEnter(idx)}
              onDragEnd={handleDragEnd}
              className={`border rounded p-2 bg-gray-50 flex flex-col items-center w-32 cursor-move ${mainImageIdx === idx ? "border-blue-500" : ""}`}
            >
              <span className="truncate w-full text-xs mb-1">{img.name}</span>
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded ${mainImageIdx === idx ? "bg-blue-700 text-white" : "bg-gray-200"}`}
                onClick={() => setMainImageIdx(idx)}
              >{mainImageIdx === idx ? "Main Image" : "Set as Main"}</button>
              <button
                type="button"
                className="text-xs text-red-500 mt-1"
                onClick={() => {
                  const newImages = images.filter((_, i) => i !== idx);
                  setImages(newImages);
                  if (mainImageIdx === idx) setMainImageIdx(0);
                  else if (mainImageIdx > idx) setMainImageIdx(mainImageIdx - 1);
                }}
              >Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreatePropertyPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    location: "Guyana",
    title: "",
    description: "",
    price: "",
    status: "draft",
    property_type: "",
    listing_type: "",
    bedrooms: "",
    bathrooms: "",
    house_size_value: "",
    house_size_unit: "sq ft",
    land_size_value: "",
    land_size_unit: "sq ft",
    year_built: "",
    amenities: "",
    features: "",
    region: "",
    city: "",
    neighborhood: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [mainImageIdx, setMainImageIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setForm({ ...form, [name]: (e.target as HTMLInputElement).checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleImageUpload = (files: File[]) => {
  setImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClientComponentClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user?.id) {
      setError("User not authenticated.");
      setLoading(false);
      return;
    }
    // Insert property
    const { data: propertyData, error: dbError } = await supabase.from("properties").insert({
      title: form.title,
      description: form.description,
      price: Number(form.price),
      status: form.status,
      property_type: form.property_type,
      listing_type: form.listing_type,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      house_size_value: form.house_size_value ? Number(form.house_size_value) : null,
      house_size_unit: form.house_size_unit,
      land_size_value: form.land_size_value ? Number(form.land_size_value) : null,
      land_size_unit: form.land_size_unit,
      location: form.location,
      year_built: form.year_built ? Number(form.year_built) : null,
      amenities: form.amenities,
      features: form.features,
      region: form.region,
      city: form.city,
      neighborhood: form.neighborhood,
      user_id: userData.user.id,
    }).select();
    if (dbError || !propertyData || !propertyData[0]?.id) {
      setError(dbError?.message || "Failed to create property.");
      setLoading(false);
      return;
    }
    // Upload images to Supabase Storage and save URLs in property_media
    const propertyId = propertyData[0].id;
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const { data: uploadData, error: uploadError } = await supabase.storage.from("property-media").upload(`${propertyId}/${file.name}`, file);
      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      const url = supabase.storage.from("property-media").getPublicUrl(`${propertyId}/${file.name}`).data.publicUrl;
      await supabase.from("property_media").insert({
        property_id: propertyId,
        url,
        type: "image",
        is_primary: i === mainImageIdx,
        position: i,
      });
    }
    router.push("/dashboard/agent/properties");
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary">Create New Property (Agent)</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basic Info */}
        <div>
          <h3 className="font-semibold mb-2">Basic Info</h3>
          {/* Location Dropdown */}
          <select name="location" value={form.location} onChange={handleChange} required className="border rounded px-3 py-2 w-full mb-2">
            <option value="Guyana">Guyana</option>
            <option value="Ghana">Ghana</option>
            <option value="Rwanda">Rwanda</option>
            <option value="South Africa">South Africa</option>
            <option value="Trinidad">Trinidad</option>
            <option value="Jamaica">Jamaica</option>
            <option value="Namibia">Namibia</option>
            <option value="Dominican Republic">Dominican Republic</option>
            <option value="Caribbean">Caribbean</option>
          </select>
          <input name="title" type="text" placeholder="Property Title" value={form.title} onChange={handleChange} required className="border rounded px-3 py-2 w-full mb-2" />
          <textarea name="description" placeholder="Description" value={form.description} onChange={handleChange} required className="border rounded px-3 py-2 w-full mb-2" />
          <input name="price" type="number" placeholder="Price (USD)" value={form.price} onChange={handleChange} required className="border rounded px-3 py-2 w-full mb-2" />
        </div>
        {/* Property Details */}
        <div>
          <h3 className="font-semibold mb-2">Property Details</h3>
          <input name="property_type" type="text" placeholder="Property Type" value={form.property_type} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="listing_type" type="text" placeholder="Listing Type (Sale/Rent)" value={form.listing_type} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="bedrooms" type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="bathrooms" type="number" placeholder="Bathrooms" value={form.bathrooms} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          {/* House Size */}
          <div className="flex gap-2 mb-2">
            <input name="house_size_value" type="number" placeholder="House Size" value={form.house_size_value} onChange={handleChange} className="border rounded px-3 py-2 w-1/2" />
            <select name="house_size_unit" value={form.house_size_unit} onChange={handleChange} className="border rounded px-3 py-2 w-1/2">
              <option value="sq ft">Sq Ft</option>
              <option value="sq m">Sq M</option>
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
          {/* Land Size */}
          <div className="flex gap-2 mb-2">
            <input name="land_size_value" type="number" placeholder="Land Size" value={form.land_size_value} onChange={handleChange} className="border rounded px-3 py-2 w-1/2" />
            <select name="land_size_unit" value={form.land_size_unit} onChange={handleChange} className="border rounded px-3 py-2 w-1/2">
              <option value="sq ft">Sq Ft</option>
              <option value="sq m">Sq M</option>
              <option value="acres">Acres</option>
              <option value="hectares">Hectares</option>
            </select>
          </div>
          {/* Location field moved to Basic Info as dropdown */}
          <input name="year_built" type="number" placeholder="Year Built" value={form.year_built} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="amenities" type="text" placeholder="Amenities (comma separated)" value={form.amenities} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="features" type="text" placeholder="Features (comma separated)" value={form.features} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
        </div>
        {/* Location Details */}
        <div>
          <h3 className="font-semibold mb-2">Location Details</h3>
          <input name="region" type="text" placeholder="Region" value={form.region} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="city" type="text" placeholder="City" value={form.city} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
          <input name="neighborhood" type="text" placeholder="Neighborhood" value={form.neighborhood} onChange={handleChange} className="border rounded px-3 py-2 w-full mb-2" />
        </div>
  {/* Agent Details (hidden for agent form) */}
        {/* Status */}
        <div>
          <h3 className="font-semibold mb-2">Status</h3>
          <select name="status" value={form.status} onChange={handleChange} className="border rounded px-3 py-2 w-full">
            <option value="draft">Draft</option>
            <option value="active">Active</option>
          </select>
        </div>
        {/* Drag-and-drop image upload with main image selection and reordering */}
        <div>
          <h3 className="font-semibold mb-2">Property Images</h3>
          <DragDropUpload images={images} setImages={setImages} mainImageIdx={mainImageIdx} setMainImageIdx={setMainImageIdx} />
        </div>
        {/* Error and submit */}
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button type="submit" disabled={loading} className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:bg-primary-dark transition">
          {loading ? "Creating..." : "Create Property"}
        </button>
      </form>
    </div>
  );
}
