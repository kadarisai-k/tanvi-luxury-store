import { useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile-only top bar: the sidebar is hidden off-canvas below the
            `lg` breakpoint, so this is the only way to open it on a phone. */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-surface border-b border-line px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-ink-950/70 hover:text-ink-950 p-1"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
          <span className="font-display text-lg font-semibold text-ink-950">Tanvi Admin</span>
        </div>

        <main className="flex-1 min-w-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
