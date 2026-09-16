"use client";
import Loading from "@/components/Loading";
import {
  CircleDollarSignIcon,
  ShoppingBasketIcon,
  StarIcon,
  TagsIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import SellerRevenueChart from "@/components/SellerRevenueChart";
import TopProducts from "@/components/TopProducts";
import AiInsightCard from "@/components/AiInsightCard";

export default function Dashboard() {
  const { getToken } = useAuth();

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalProducts: 0,
    totalEarnings: 0,
    totalOrders: 0,
    ratings: [],
    recentOrders: [],
  });
  const [range, setRange] = useState(30);

  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);

  const dashboardCardsData = [
    {
      title: "Total Products",
      value: dashboardData?.totalProducts || 0,
      icon: ShoppingBasketIcon,
    },
    {
      title: "Total Earnings",
      value: currency + (dashboardData?.totalEarnings || 0),
      icon: CircleDollarSignIcon,
    },
    {
      title: "Total Orders",
      value: dashboardData?.totalOrders || 0,
      icon: TagsIcon,
    },
    {
      title: "Total Ratings",
      value: dashboardData?.ratings?.length || 0,
      icon: StarIcon,
    },
  ];

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/store/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDashboardData(data.dashboardData || data);
    } catch (error) {
      toast.error(error?.response?.data?.error || error.message);
    }
    setLoading(false);
  };

  const fetchInsight = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/store/ai-insight", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsight(data.insight);
    } catch (error) {
      // Non-critical widget; fail silently and just show the empty state.
    }
    setInsightLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    fetchInsight();
  }, []);

  if (loading) return <Loading />;

  return (
    <div className="w-full mb-20">
      <h1 className="text-2xl text-muted">
        Seller <span className="text-white font-semibold">Dashboard</span>
      </h1>

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mt-6">
        {dashboardCardsData.map((card, index) => (
          <div
            key={index}
            className="flex items-center gap-4 bg-panel border border-white/10 rounded-2xl p-5"
          >
            <div className="size-12 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <card.icon size={22} />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="text-xs text-muted truncate">{card.title}</p>
              <b className="text-2xl font-semibold text-white truncate">
                {card.value}
              </b>
            </div>
          </div>
        ))}
      </div>

      {/* AI Store Health */}
      <div className="mt-10">
        <h2 className="text-2xl text-muted mb-6">
          This <span className="text-white font-semibold">Week</span>
        </h2>
        <AiInsightCard title="Store Health" insight={insight} loading={insightLoading} />
      </div>

      {/* Revenue Trend */}
      <div className="flex items-center justify-between flex-wrap gap-3 mt-10">
        <h2 className="text-2xl text-muted">
          Revenue <span className="text-white font-semibold">Trend</span>
        </h2>
        <div className="inline-flex bg-panel border border-white/10 rounded-lg p-1">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setRange(days)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                range === days
                  ? "bg-accent text-slate-900 font-semibold"
                  : "text-muted hover:text-white"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
        <div className="lg:col-span-2 bg-panel border border-white/10 rounded-2xl p-6">
          <SellerRevenueChart recentOrders={dashboardData.recentOrders} range={range} />
        </div>
        <div className="bg-panel border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            <span className="text-muted">Top /</span> Products
          </h3>
          <TopProducts recentOrders={dashboardData.recentOrders} range={range} />
        </div>
      </div>

      {/* Reviews */}
      <h2 className="text-2xl text-muted mt-10">
        Total <span className="text-white font-semibold">Reviews</span>
      </h2>

      {dashboardData.ratings.length ? (
        <div className="flex flex-col gap-4 mt-6">
          {dashboardData.ratings.map((review, index) => (
            <div
              key={index}
              className="flex max-sm:flex-col gap-5 sm:items-center justify-between bg-panel border border-white/10 rounded-2xl p-5"
            >
              <div>
                <div className="flex gap-3">
                  <Image
                    src={review.user.image}
                    alt=""
                    className="size-10 aspect-square rounded-full ring-2 ring-white/10"
                    width={100}
                    height={100}
                  />
                  <div>
                    <p className="font-medium text-slate-100">
                      {review.user.name}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(review.createdAt).toDateString()}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-slate-300 max-w-xs leading-relaxed">
                  {review.review}
                </p>
              </div>
              <div className="flex flex-col justify-between gap-4 sm:items-end">
                <div className="flex flex-col sm:items-end gap-1">
                  <p className="text-xs text-muted">{review.product?.category}</p>
                  <p className="font-medium text-slate-100">
                    {review.product?.name}
                  </p>
                  <div className="flex items-center">
                    {Array(5)
                      .fill("")
                      .map((_, index) => (
                        <StarIcon
                          key={index}
                          size={16}
                          className="text-transparent mt-0.5"
                          fill={
                            review.rating >= index + 1 ? "#00C950" : "#14532D"
                          }
                        />
                      ))}
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/product/${review.product.id}`)}
                  className="px-5 py-2 border border-white/10 text-slate-200 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
                >
                  View Product
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-60">
          <p className="text-2xl text-muted font-medium">No reviews yet</p>
        </div>
      )}
    </div>
  );
}
