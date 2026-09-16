"use client";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Loader2, SparklesIcon, UploadCloud, X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const categories = [
  "Electronics",
  "Clothing",
  "Home & Kitchen",
  "Beauty & Health",
  "Toys & Games",
  "Sports & Outdoors",
  "Books & Media",
  "Food & Drink",
  "Hobbies & Crafts",
  "Others",
];

const FormField = ({ label, name, textarea, ...rest }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-white mb-2">
      {label}
    </label>
    {textarea ? (
      <textarea
        id={name}
        name={name}
        className="w-full min-h-24 resize-y bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none transition-colors"
        {...rest}
      />
    ) : (
      <input
        id={name}
        name={name}
        className="w-full h-12 bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 outline-none transition-colors"
        {...rest}
      />
    )}
  </div>
);

const ProductEditModal = ({ product, onClose, onSaved }) => {
  const { getToken } = useAuth();

  const [images, setImages] = useState({
    0: product.images[0] || null,
    1: product.images[1] || null,
    2: product.images[2] || null,
    3: product.images[3] || null,
  });
  const [productInfo, setProductInfo] = useState({
    name: product.name,
    brand: product.brand || "",
    description: product.description,
    mrp: product.mrp,
    price: product.price,
    category: product.category,
  });
  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const onChangeHandler = (e) => {
    setProductInfo({ ...productInfo, [e.target.name]: e.target.value });
  };

  const onBoostWithAi = async () => {
    if (!productInfo.name || !productInfo.description || !productInfo.category) {
      return toast.error("Add a name, description and category first");
    }
    setAiLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/seller/ai/improve-listing",
        {
          brand: productInfo.brand,
          title: productInfo.name,
          description: productInfo.description,
          category: productInfo.category,
          currentPrice: Number(productInfo.price),
          currency: process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "USD",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProductInfo({ ...productInfo, name: data.title, description: data.description });
      setAiSuggestion(data);
      toast.success("Listing boosted — review before saving");
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setAiLoading(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    try {
      const hasAnyImage = Object.values(images).some((image) => image);
      if (!hasAnyImage) {
        return toast.error("Please upload at least one image");
      }
      if (!productInfo.category) {
        return toast.error("Please select a category");
      }
      setLoading(true);

      const formData = new FormData();
      formData.append("productId", product.id);
      formData.append("name", productInfo.name);
      formData.append("brand", productInfo.brand);
      formData.append("description", productInfo.description);
      formData.append("mrp", productInfo.mrp);
      formData.append("price", productInfo.price);
      formData.append("category", productInfo.category);

      const existingImages = Object.keys(images).map((key) =>
        typeof images[key] === "string" ? images[key] : null
      );
      formData.append("existingImages", JSON.stringify(existingImages));

      Object.keys(images).forEach((key) => {
        if (images[key] && typeof images[key] !== "string") {
          formData.append(`image_${key}`, images[key]);
        }
      });

      const token = await getToken();
      const { data } = await axios.put("/api/store/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Product updated successfully");
      onSaved(data.product);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 px-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-panel border border-white/10 rounded-2xl shadow-2xl shadow-black/40 max-w-3xl w-full p-6 sm:p-8 relative max-h-[85vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 size-8 flex items-center justify-center rounded-lg text-muted hover:bg-white/5 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-xl font-semibold text-white mb-6">
          Edit Product
        </h2>

        <form
          onSubmit={(e) =>
            toast.promise(onSubmitHandler(e), { loading: "Saving changes..." })
          }
          className="flex flex-col gap-6"
        >
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
            {/* Left column */}
            <div className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Product Images
                </label>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(images).map((key) => {
                    const value = images[key];
                    const previewSrc =
                      value && typeof value !== "string"
                        ? URL.createObjectURL(value)
                        : value;

                    return (
                      <label
                        key={key}
                        htmlFor={`edit-images${key}`}
                        className="group relative flex flex-col items-center justify-center size-20 rounded-2xl border-2 border-dashed border-accent/40 hover:border-accent bg-white/5 cursor-pointer transition-colors overflow-hidden shrink-0"
                      >
                        {previewSrc ? (
                          <>
                            <Image
                              width={100}
                              height={100}
                              className="w-full h-full object-cover"
                              src={previewSrc}
                              alt=""
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                setImages({ ...images, [key]: null });
                              }}
                              className="absolute top-1 right-1 size-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <UploadCloud
                            size={22}
                            className="text-accent/70 group-hover:text-accent transition-colors"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          id={`edit-images${key}`}
                          onChange={(e) =>
                            setImages({ ...images, [key]: e.target.files[0] })
                          }
                          hidden
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Name"
                  name="name"
                  type="text"
                  onChange={onChangeHandler}
                  value={productInfo.name}
                  placeholder="Enter product name"
                  required
                />
                <FormField
                  label="Brand"
                  name="brand"
                  type="text"
                  onChange={onChangeHandler}
                  value={productInfo.brand}
                  placeholder="Optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Actual Price"
                  name="mrp"
                  type="number"
                  onChange={onChangeHandler}
                  value={productInfo.mrp}
                  placeholder="0"
                  required
                />
                <FormField
                  label="Offer Price"
                  name="price"
                  type="number"
                  onChange={onChangeHandler}
                  value={productInfo.price}
                  placeholder="0"
                  required
                />
              </div>

              {aiSuggestion?.suggestedPriceRange && (
                <p className="-mt-3 text-xs text-accent">
                  AI suggests {process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}
                  {aiSuggestion.suggestedPriceRange.min}–
                  {process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$"}
                  {aiSuggestion.suggestedPriceRange.max}
                  {aiSuggestion.priceReasoning ? ` — ${aiSuggestion.priceReasoning}` : ""}
                </p>
              )}
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="edit-description" className="block text-sm font-medium text-white">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={onBoostWithAi}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover disabled:opacity-50 transition-colors"
                  >
                    {aiLoading ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <SparklesIcon size={13} />
                    )}
                    {aiLoading ? "Boosting..." : "Boost with AI"}
                  </button>
                </div>
                <textarea
                  id="edit-description"
                  name="description"
                  onChange={onChangeHandler}
                  value={productInfo.description}
                  placeholder="Enter product description"
                  rows={4}
                  required
                  className="w-full min-h-24 resize-y bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none transition-colors"
                />
              </div>

              {aiSuggestion?.tags?.length > 0 && (
                <div className="-mt-3 flex flex-wrap gap-2">
                  {aiSuggestion.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-accent/15 text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Category
                </label>
                <CustomSelect
                  options={categories}
                  value={productInfo.category}
                  onChange={(category) =>
                    setProductInfo({ ...productInfo, category })
                  }
                  placeholder="Select a category"
                />
              </div>
            </div>
          </div>

          <button
            disabled={loading}
            className="self-start px-8 py-3 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductEditModal;
