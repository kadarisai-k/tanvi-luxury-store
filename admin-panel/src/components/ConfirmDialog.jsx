export default function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-ink-950/40 flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl2 shadow-card w-full max-w-sm p-6">
        <h3 className="font-display text-lg font-semibold text-ink-950">{title}</h3>
        <p className="text-sm text-ink-950/60 mt-2">{message}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 border border-line rounded-lg py-2.5 text-sm font-medium text-ink-950/70 hover:bg-canvas transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium text-white transition-colors ${
              danger ? "bg-danger hover:bg-danger/90" : "bg-plum-700 hover:bg-plum-800"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
