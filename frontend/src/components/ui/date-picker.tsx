/**
 * Custom DatePicker
 *
 * A fully themed calendar dropdown matching the dispatchCore design system.
 * Renders a pill-button trigger that opens a floating calendar panel.
 */

import { useState, useRef, useEffect } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  min?: string; // YYYY-MM-DD
  label?: string;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function DatePicker({ value, onChange, min, label }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Viewing month/year (independent of selection)
  const today = new Date();
  const initial = value ? new Date(value + "T00:00:00") : today;
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync view when value changes externally (controlled component pattern)
  /* eslint-disable react-hooks/set-state-in-effect -- Syncing controlled prop to local view state */
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Build the calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isDisabled = (day: number) => {
    if (!min) return false;
    const cellDate = new Date(viewYear, viewMonth, day);
    const minDate = new Date(min + "T00:00:00");
    minDate.setHours(0, 0, 0, 0);
    return cellDate < minDate;
  };

  const isSelected = (day: number) => {
    if (!value) return false;
    const sel = new Date(value + "T00:00:00");
    return (
      sel.getFullYear() === viewYear &&
      sel.getMonth() === viewMonth &&
      sel.getDate() === day
    );
  };

  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() === viewMonth &&
    today.getDate() === day;

  const selectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${viewYear}-${m}-${d}`);
    setOpen(false);
  };

  const displayValue = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Check if prev month should be disabled (can't go before min month)
  const canGoPrev = (() => {
    if (!min) return true;
    const minDate = new Date(min + "T00:00:00");
    return viewYear > minDate.getFullYear() || (viewYear === minDate.getFullYear() && viewMonth > minDate.getMonth());
  })();

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
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 truncate">
          {displayValue || "Select date"}
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[300px] bg-card border border-border rounded-2xl shadow-xl p-4 animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Month / year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoPrev}
              className="p-1.5 rounded-full hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div
                key={d}
                className="text-[10px] font-semibold text-muted-foreground text-center py-1 uppercase tracking-wider"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, i) =>
              day === null ? (
                <div key={`empty-${i}`} />
              ) : (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled(day)}
                  onClick={() => selectDay(day)}
                  className={`h-9 w-full rounded-full text-xs font-medium transition-all duration-150 ${
                    isSelected(day)
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isToday(day)
                        ? "bg-primary/10 text-primary font-semibold"
                        : isDisabled(day)
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : "text-foreground hover:bg-muted"
                  }`}
                >
                  {day}
                </button>
              ),
            )}
          </div>

          {/* Today shortcut */}
          {!isDisabled(today.getDate()) && viewMonth === today.getMonth() && viewYear === today.getFullYear() && (
            <button
              type="button"
              onClick={() => selectDay(today.getDate())}
              className="mt-3 w-full text-center text-xs font-medium text-primary hover:underline underline-offset-2"
            >
              Today
            </button>
          )}
        </div>
      )}
    </div>
  );
}
