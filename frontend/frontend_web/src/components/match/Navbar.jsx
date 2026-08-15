export default function Navbar({ active, onNavigate }) {
  const items = [{ key: "discover", label: "Discover" }];

  return (
    <nav className="flex items-center gap-6 px-6 py-4 border-b border-surface/10">
      <span className="font-display text-lg font-semibold text-surface">SkillSwap</span>
      <div className="flex gap-1">
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              active === item.key
                ? "bg-surface text-ink"
                : "text-surface/70 hover:text-surface"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
