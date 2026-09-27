import { useState, useEffect } from "react";

const STATUSES = [
  { value: "to-read", label: "TBR" },
  { value: "currently-reading", label: "Leser" },
  { value: "read", label: "Lest" },
  { value: "dnf", label: "DNF" },
];

const StatusSelector = ({ currentStatus, onStatusChange, loading = false }) => {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  useEffect(() => {
    setSelectedStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusClick = async (status) => {
    setSelectedStatus(status);
    if (onStatusChange) {
      try {
        await onStatusChange(status);
      } catch (error) {
        setSelectedStatus(currentStatus);
        console.error("Greide ikke lagre status:", error);
      }
    }
  };

  return (
    <div>
      <div
        className="flex rounded-lg overflow-hidden mb-1.5"
        style={{ border: "1.5px solid var(--color-border-strong)" }}
      >
        {STATUSES.map((status, i) => {
          const isSelected = selectedStatus === status.value;
          return (
            <button
              key={status.value}
              onClick={() => handleStatusClick(status.value)}
              disabled={loading}
              className="flex-1 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderLeft: i > 0 ? "1.5px solid var(--color-border-strong)" : "none",
                background: isSelected ? "var(--color-primary)" : "var(--color-card)",
                color: isSelected ? "white" : "var(--color-text-muted)",
              }}
            >
              {status.label}
            </button>
          );
        })}
      </div>
      {selectedStatus && (
        <p className="text-xs" style={{ color: "var(--color-text-faint)" }}>
          Klikk på status igjen for å fjerne den
        </p>
      )}
    </div>
  );
};

export default StatusSelector;
