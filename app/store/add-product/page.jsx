"use client";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { Loader2, SparklesIcon, UploadCloud, X } from "lucide-react";
import CustomSelect from "@/components/CustomSelect";

const FormField = ({ label, name, textarea, ...rest }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-white mb-2">
      {label}
    </label>
    {textarea ? (
      <textarea
        id={name}
        name={name}
        className="w-full min-h-28 resize-y bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none transition-colors"
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

export default function StoreAddProduct() {
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

  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [productInfo, setProductInfo] = useState({
    name: "",
    brand: "",
    description: "",
    mrp: 0,
    price: 0,
    category: "",
  });
  const [loading, setLoading] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const { getToken } = useAuth();

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
      if (!images[1] && !images[2] && !images[3] && !images[4]) {
        return toast.error("Please upload at least one image");
      }
      if (!productInfo.category) {
        return toast.error("Please select a category");
      }
      setLoading(true);

      const formData = new FormData();
      formData.append("name", productInfo.name);
      formData.append("brand", productInfo.brand);
      formData.append("description", productInfo.description);
      formData.append("mrp", productInfo.mrp);
      formData.append("price", productInfo.price);
      formData.append("category", productInfo.category);

      Object.keys(images).forEach((key) => {
        images[key] && formData.append("images", images[key]);
      });
      const token = await getToken();
      const { data } = await axios.post("/api/store/product", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Product added successfully");

      setProductInfo({
        name: "",
        brand: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
      });
      setImages({ 1: null, 2: null, 3: null, 4: null });
      setAiSuggestion(null);
      setLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full mb-20">
      <h1 className="text-2xl text-muted">
        Add New <span className="text-white font-semibold">Product</span>
      </h1>

      <form
        onSubmit={(e) =>
          toast.promise(onSubmitHandler(e), { loading: "Adding Product..." })
        }
        className="bg-panel border border-white/10 rounded-2xl p-6 sm:p-8 mt-6 w-full flex flex-col gap-6"
      >
        <div className="grid lg:grid-cols-2 gap-x-10 gap-y-6">
          {/* Left column */}
          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Product Images
              </label>
              <div className="flex flex-wrap gap-4">
                {Object.keys(images).map((key) => (
                  <label
                    key={key}
                    htmlFor={`images${key}`}
                    className="group relative flex flex-col items-center justify-center size-20 rounded-2xl border-2 border-dashed border-accent/40 hover:border-accent bg-white/5 cursor-pointer transition-colors overflow-hidden shrink-0"
                  >
                    {images[key] ? (
                      <>
                        <Image
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                          src={URL.createObjectURL(images[key])}
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
                      id={`images${key}`}
                      onChange={(e) =>
                        setImages({ ...images, [key]: e.target.files[0] })
                      }
                      hidden
                    />
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted mt-2">
                Upload up to 4 images, PNG or JPG.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
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

            <div className="grid sm:grid-cols-2 gap-5">
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
                <label htmlFor="description" className="block text-sm font-medium text-white">
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
                id="description"
                name="description"
                onChange={onChangeHandler}
                value={productInfo.description}
                placeholder="Enter product description"
                rows={5}
                required
                className="w-full min-h-28 resize-y bg-white/5 text-slate-100 placeholder-slate-500 border border-white/10 focus:border-accent rounded-lg px-4 py-3 outline-none transition-colors"
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
          {loading ? "Adding..." : "Add Product"}
        </button>
      </form>
    </div>
  );
}
