"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  HomeIcon,
  LayoutListIcon,
  MessageCircleIcon,
  SquarePenIcon,
  SquarePlusIcon,
  StoreIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

const StoreSidebar = ({ storeInfo }) => {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/store/messages/pending-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPendingCount(data.count);
      } catch (error) {
        // Non-critical badge; ignore.
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    window.addEventListener("messages-updated", fetchPendingCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener("messages-updated", fetchPendingCount);
    };
  }, []);

  const sidebarLinks = [
    { name: "Dashboard", href: "/store", icon: HomeIcon },
    { name: "Add Product", href: "/store/add-product", icon: SquarePlusIcon },
    {
      name: "Manage Product",
      href: "/store/manage-product",
      icon: SquarePenIcon,
    },
    { name: "Orders", href: "/store/orders", icon: LayoutListIcon },
    { name: "Inbox", href: "/store/messages", icon: MessageCircleIcon, badge: pendingCount },
  ];

  return (
    <div className="flex h-full flex-col gap-6 border-r border-white/10 bg-panel/40 sm:min-w-60 shrink-0">
      <div className="flex flex-col gap-3 justify-center items-center pt-8 px-4 max-sm:hidden">
        {storeInfo?.logo ? (
          <Image
            className="size-14 rounded-full ring-2 ring-white/10 object-cover"
            src={storeInfo.logo}
            alt={storeInfo?.name || "Store"}
            width={80}
            height={80}
          />
        ) : (
          <div className="size-14 rounded-full ring-2 ring-white/10 bg-white/5 flex items-center justify-center text-muted">
            <StoreIcon size={22} />
          </div>
        )}
        <p className="text-sm text-slate-300 text-center">
          <span className="text-slate-100 font-medium">{storeInfo?.name}</span>
        </p>
      </div>

      <nav className="flex flex-col gap-1 px-3 max-sm:mt-6 max-sm:px-2">
        {sidebarLinks.map((link, index) => {
          const isActive =
            link.href === "/store"
              ? pathname === link.href
              : pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={index}
              href={link.href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-accent" />
              )}
              <link.icon size={18} className="shrink-0 sm:ml-1" />
              <p className="max-sm:hidden flex-1">{link.name}</p>
              {!!link.badge && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-accent text-slate-900 text-[11px] font-bold flex items-center justify-center max-sm:hidden">
                  {link.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default StoreSidebar;
