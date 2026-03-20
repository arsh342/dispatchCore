/**
 * Custom TimePicker
 *
 * A scrollable hour/minute picker matching the dispatchCore design system.
 * Renders a pill-button trigger that opens a floating time-selection panel.
 */

import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // HH:MM (24h)
  onChange: (time: string) => void;
  label?: string;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const [selectedHour, setSelectedHour] = useState<number | null>(
    value ? parseInt(value.split(":")[0], 10) : null,
  );
  const [selectedMinute, setSelectedMinute] = useState<number | null>(
    value ? parseInt(value.split(":")[1], 10) : null,
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, []);

  // Sync from external value (controlled component pattern)
  /* eslint-disable react-hooks/set-state-in-effect -- Syncing controlled prop to local state */
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(":").map(Number);
      setSelectedHour(h);
      setSelectedMinute(m);
    }
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Scroll to selected on open
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        if (hourRef.current && selectedHour !== null) {
          const el = hourRef.current.querySelector(
            `[data-hour="${selectedHour}"]`,
          );
          el?.scrollIntoView({ block: "center", behavior: "instant" });
        }
        if (minuteRef.current && selectedMinute !== null) {
          const el = minuteRef.current.querySelector(
            `[data-minute="${selectedMinute}"]`,
          );
          el?.scrollIntoView({ block: "center", behavior: "instant" });
        }
      });
    }
  }, [open, selectedHour, selectedMinute]);

  const commitTime = (h: number | null, m: number | null) => {
    if (h !== null && m !== null) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      onChange(`${hh}:${mm}`);
    }
  };

  const selectHour = (h: number) => {
    setSelectedHour(h);
    commitTime(h, selectedMinute);
  };

  const selectMinute = (m: number) => {
    setSelectedMinute(m);
    commitTime(selectedHour, m);
  };

  // Display text
  const displayValue = (() => {
    if (selectedHour === null || selectedMinute === null) return "";
    const h = selectedHour % 12 || 12;
    const ampm = selectedHour < 12 ? "AM" : "PM";
    const mm = String(selectedMinute).padStart(2, "0");
    return `${h}:${mm} ${ampm}`;
  })();

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5); // 5-min intervals

  const formatHourLabel = (h: number) => {
    const hr = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    return `${hr} ${ampm}`;
  };

  return (
    <div className="relative" ref={ref}>
      {label && (
        <label className="text-sm font-medium text-secondary-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-full border text-sm transition-colors text-left ${
          open
            ? "border-primary bg-muted ring-2 ring-primary/20"
            : "border-border bg-muted hover:border-primary/40"
        } ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <Clock className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 truncate">
          {displayValue || "Select time"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[240px] bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-border bg-muted/50">
            <p className="text-xs font-semibold text-foreground">
              {displayValue || "Pick a time"}
            </p>
          </div>

          <div className="flex divide-x divide-border">
            {/* Hours column */}
            <div
              ref={hourRef}
              className="flex-1 h-[200px] overflow-y-auto py-1 scrollbar-thin"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center py-1">
                Hour
              </p>
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  data-hour={h}
                  onClick={() => selectHour(h)}
                  className={`w-full px-3 py-1.5 text-xs text-center transition-colors ${
                    selectedHour === h
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {formatHourLabel(h)}
                </button>
              ))}
            </div>

            {/* Minutes column */}
            <div
              ref={minuteRef}
              className="flex-1 h-[200px] overflow-y-auto py-1 scrollbar-thin"
            >
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center py-1">
                Min
              </p>
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  data-minute={m}
                  onClick={() => selectMinute(m)}
                  className={`w-full px-3 py-1.5 text-xs text-center transition-colors ${
                    selectedMinute === m
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  :{String(m).padStart(2, "0")}
                </button>
              ))}
            </div>
          </div>

          {/* Done button */}
          <div className="px-3 py-2 border-t border-border">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={selectedHour === null || selectedMinute === null}
              className="w-full py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
