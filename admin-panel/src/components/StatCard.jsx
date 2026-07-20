export default function StatCard({ label, value, sublabel, accent = "plum" }) {
  const accentClasses = {
    plum: "text-plum-700 bg-plum-50",
    gold: "text-gold-600 bg-gold-400/10",
    danger: "text-danger bg-danger/10",
  };

  return (
    <div className="bg-surface rounded-xl2 shadow-card p-5 flex flex-col gap-1">
      <div className="text-xs font-medium uppercase tracking-wide text-ink-950/50">{label}</div>
      <div className="font-display text-2xl font-semibold text-ink-950 mt-1">{value}</div>
      {sublabel && (
        <div className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full w-fit ${accentClasses[accent]}`}>
          {sublabel}
        </div>
      )}
    </div>
  );
}
