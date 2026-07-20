import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { getSettings, updateSettings } from "../api/endpoints";

export default function Settings() {
  const [announcementText, setAnnouncementText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setAnnouncementText(s.announcementText || ""))
      .catch(() => setError("Couldn't load settings."))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const s = await updateSettings({ announcementText });
      setAnnouncementText(s.announcementText || "");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Couldn't save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Settings</h1>
        <p className="text-sm text-ink-950/50 mt-0.5">
          Store-wide text shown on the customer site.
        </p>
      </div>

      {loading && <div className="text-sm text-ink-950/50">Loading…</div>}

      {!loading && (
        <form
          onSubmit={handleSave}
          className="bg-surface rounded-xl2 shadow-card p-5 max-w-xl flex flex-col gap-4"
        >
          <div>
            <label className="text-sm font-medium text-ink-950/80">
              Announcement bar text
            </label>
            <p className="text-xs text-ink-950/40 mt-0.5 mb-2">
              Shown as a thin strip at the very top of the home page. Leave this blank and
              nothing will be shown there.
            </p>
            <input
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              maxLength={300}
              placeholder="e.g. Complimentary shipping on orders above ₹999 · Handpicked with love from Hyderabad"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm focus:border-plum-600 outline-none"
            />
            <p className="text-xs text-ink-950/30 mt-1 text-right">
              {announcementText.length}/300
            </p>
          </div>

          {error && (
            <div className="text-sm text-danger bg-danger/10 rounded-lg px-3 py-2">{error}</div>
          )}
          {saved && (
            <div className="text-sm text-success bg-success/10 rounded-lg px-3 py-2">
              Saved.
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={saving}
              className="bg-plum-700 hover:bg-plum-800 disabled:opacity-60 text-white rounded-lg px-5 py-2.5 text-sm font-medium transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      )}
    </AppLayout>
  );
}
