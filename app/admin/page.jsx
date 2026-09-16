"use client";
import Loading from "@/components/Loading";
import OrdersAreaChart from "@/components/OrdersAreaChart";
import AiInsightCard from "@/components/AiInsightCard";
import { useAuth } from "@clerk/nextjs";
import {
  CircleDollarSignIcon,
  ShoppingBasketIcon,
  StoreIcon,
  TagsIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const { getToken } = useAuth();

  const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || "$";

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    products: 0,
    revenue: 0,
    orders: 0,
    stores: 0,
    allOrders: [],
  });

  const [insight, setInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(true);

  const dashboardCardsData = [
    {
      title: "Total Products",
      value: dashboardData.products,
      icon: ShoppingBasketIcon,
    },
    {
      title: "Total Revenue",
      value: currency + dashboardData.revenue,
      icon: CircleDollarSignIcon,
    },
    { title: "Total Orders", value: dashboardData.orders, icon: TagsIcon },
    { title: "Total Stores", value: dashboardData.stores, icon: StoreIcon },
  ];

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDashboardData(data.dashboardData);
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }
    setLoading(false);
  };

  const fetchInsight = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get("/api/admin/ai-insight", {
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
    <div className="w-full">
      <h1 className="text-2xl text-muted">
        Admin <span className="text-white font-semibold">Dashboard</span>
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

      {/* Area Chart */}
      <div className="w-full bg-panel border border-white/10 rounded-2xl p-6 mt-6">
        <OrdersAreaChart allOrders={dashboardData.allOrders} />
      </div>

      {/* AI Platform Insights */}
      <div className="mt-6">
        <h2 className="text-2xl text-muted mb-6">
          Platform <span className="text-white font-semibold">Insights</span>
        </h2>
        <AiInsightCard title="Weekly Digest" insight={insight} loading={insightLoading} />
      </div>
    </div>
  );
}
