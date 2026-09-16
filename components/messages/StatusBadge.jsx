const statusConfig = {
  PENDING: { label: "Pending", className: "bg-amber-500/15 text-amber-400" },
  ACTIVE: { label: "Active", className: "bg-emerald-500/15 text-emerald-400" },
  DECLINED: { label: "Declined", className: "bg-red-500/15 text-red-400" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
