"use client";
import { House, PackageIcon, PackageSearch, ShieldCheckIcon, ShoppingCart, StoreIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useUser, useClerk, useAuth, UserButton, Protect } from "@clerk/nextjs";
import axios from "axios";
const Navbar = () => {
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const { getToken } = useAuth();
  const router = useRouter();

  const cartCount = useSelector((state) => state.cart.total);
  const [isAdmin, setIsAdmin] = useState(false);
  const [storeStatus, setStoreStatus] = useState(null); // null = still checking

  useEffect(() => {
    const fetchIsAdmin = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/admin/is-admin", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsAdmin(data.isAdmin);
      } catch (error) {
        setIsAdmin(false);
      }
    };

    const fetchStoreStatus = async () => {
      try {
        const token = await getToken();
        const { data } = await axios.get("/api/store/create", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStoreStatus(data.status);
      } catch (error) {
        setStoreStatus("Not registered");
      }
    };

    if (user) {
      fetchIsAdmin();
      fetchStoreStatus();
    } else {
      setIsAdmin(false);
      setStoreStatus(null);
    }
  }, [user]);

  const sellerCheckLoading = !!user && storeStatus === null;

  const sellerLink =
    storeStatus === "approved"
      ? { label: "My Store", href: "/store", className: "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white" }
      : storeStatus === "pending"
      ? { label: "Store Pending Approval", href: "/create-store", className: "border-slate-700 text-slate-400 hover:border-slate-500" }
      : storeStatus === "rejected"
      ? { label: "Store Rejected", href: "/create-store", className: "border-red-500/40 text-red-400 hover:border-red-500" }
      : { label: "Sell on NexBuy", href: "/create-store", className: "border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-white" };

  return (
    <nav className="relative bg-neutral-950">
      <div className="mx-6">
        <div className="flex items-center justify-between max-w-[1600px] mx-auto py-4  transition-all">
          <Link
            href="/"
            className="relative text-4xl font-semibold text-slate-100"
          >
            <span className="text-amber-600">Nex</span>Buy
            <span className="text-amber-600 text-5xl leading-0">.</span>
            <Protect plan='plus'>
            <p className="absolute text-xs font-semibold -top-1 -right-8 px-3 p-0.5 rounded-full flex items-center gap-2 text-white bg-amber-500">
              plus
            </p>
            </Protect>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden sm:flex items-center gap-4 lg:gap-8 text-slate-300 text-[17px]">
            <Link href="/" className="flex items-center gap-2 hover:text-amber-500 transition-colors">
              <House size={18} />
              Home
            </Link>
            <Link href="/shop" className="flex items-center gap-2 hover:text-amber-500 transition-colors">
              <PackageSearch size={18} />
              Shop
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 text-slate-300 hover:text-amber-500 transition-colors"
            >
              <ShoppingCart size={18} />
              Cart
              <span className="absolute -top-1 left-3 flex items-center justify-center text-[8px] text-white bg-slate-600 size-3.5 rounded-full">
                {cartCount}
              </span>
            </Link>

            {user && (
              <Link
                href="/orders"
                className="flex items-center gap-2 text-slate-300 hover:text-amber-500 transition-colors"
              >
                <PackageIcon size={18} />
                Orders
              </Link>
            )}

            {sellerCheckLoading ? (
              <div className="w-36 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : (
              <Link
                href={sellerLink.href}
                className={`flex items-center gap-2 border ${sellerLink.className} transition px-4 py-1.5 rounded-full text-sm`}
              >
                <StoreIcon size={16} />
                {sellerLink.label}
              </Link>
            )}

            {!user ? (
              <button
                onClick={openSignIn}
                className="px-8 py-2 bg-amber-500 hover:bg-amber-600 transition text-white rounded-full"
              >
                Login
              </button>
            ) : (
              <UserButton userProfileMode="navigation" userProfileUrl="/profile">
                <UserButton.MenuItems>
                  {isAdmin && (
                    <UserButton.Action
                      labelIcon={<ShieldCheckIcon size={16} />}
                      label="Admin"
                      onClick={() => router.push("/admin")}
                    />
                  )}
                </UserButton.MenuItems>
              </UserButton>
            )}
          </div>

          {/* Mobile User Button  */}
          <div className="sm:hidden">
            {user ? (
              <UserButton userProfileMode="navigation" userProfileUrl="/profile">
                <UserButton.MenuItems>
                  <UserButton.Action
                    labelIcon={<ShoppingCart size={16} />}
                    label="Cart"
                    onClick={() => router.push("/cart")}
                  />
                  <UserButton.Action
                    labelIcon={<PackageIcon size={16} />}
                    label="My Orders"
                    onClick={() => router.push("/orders")}
                  />
                  {!sellerCheckLoading && (
                    <UserButton.Action
                      labelIcon={<StoreIcon size={16} />}
                      label={sellerLink.label}
                      onClick={() => router.push(sellerLink.href)}
                    />
                  )}
                  {isAdmin && (
                    <UserButton.Action
                      labelIcon={<ShieldCheckIcon size={16} />}
                      label="Admin"
                      onClick={() => router.push("/admin")}
                    />
                  )}
                </UserButton.MenuItems>
              </UserButton>
            ) : (
              <button
                onClick={openSignIn}
                className="px-7 py-1.5 bg-amber-500 hover:bg-amber-600 text-sm transition text-white rounded-full"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </div>
      <hr className="border-slate-800" />
    </nav>
  );
};

export default Navbar;
