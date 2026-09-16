"use client";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

const AdminNavbar = () => {
  const { user } = useUser();

  return (
    <div className="flex items-center justify-between h-16 px-6 lg:px-8 border-b border-white/10 bg-panel">
      <Link href="/" className="flex items-center gap-2.5">
        <span className="text-2xl font-semibold text-white leading-none">
          <span className="text-accent">Nex</span>Buy<span className="text-accent">.</span>
        </span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-accent/15 text-accent">
          Admin
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <p className="text-sm text-muted max-sm:hidden">
          Hi, <span className="text-slate-200 font-medium">{user?.firstName}</span>
        </p>
        <UserButton userProfileMode="navigation" userProfileUrl="/profile" />
      </div>
    </div>
  );
};

export default AdminNavbar;
