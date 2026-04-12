import { useEffect, useMemo, useState } from "react";

import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

type HeatmapDay = {
  date: string;
  count: number;
};

type StreakHeatmapProps = {
  title: string;
  currentStreak: number;
  longestStreak: number;
  days: HeatmapDay[];
  className?: string;
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function getHeatmapTone(count: number) {
  if (count >= 4) return "bg-primary";
  if (count === 3) return "bg-primary/90";
  if (count === 2) return "bg-primary/80";
  if (count === 1) return "bg-primary/70";
  return "bg-muted";
}

type MonthDay = {
  date: string;
  count: number;
  blank: boolean;
};

type MonthGroup = {
  key: string;
  label: string;
  year: number;
  month: number;
  days: MonthDay[];
};

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function parseDateParts(date: string): DateParts {
  const [yearPart, monthPart, dayPart] = date.split("-");

  return {
    year: Number(yearPart),
    month: Number(monthPart),
    day: Number(dayPart),
  };
}

function compareDateStrings(left: string, right: string) {
  return left.localeCompare(right);
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function addMonths(year: number, month: number, amount: number) {
  const date = new Date(year, month - 1, 1);
  date.setMonth(date.getMonth() + amount);

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function buildMonthGroups(days: HeatmapDay[]) {
  const dayMap = new Map(days.map((day) => [day.date, day.count]));

  const activeDays = days.filter((day) => day.count > 0);
  const rangeDays = activeDays.length ? activeDays : days;
  if (!rangeDays.length) {
    return [];
  }

  const sortedDays = [...rangeDays].sort((left, right) =>
    compareDateStrings(left.date, right.date),
  );
  const firstDate = parseDateParts(sortedDays[0].date);
  const lastDate = parseDateParts(sortedDays[sortedDays.length - 1].date);

  const lastMonthKey = `${lastDate.year}-${String(lastDate.month).padStart(2, "0")}`;

  const months: MonthGroup[] = [];
  let cursorYear = firstDate.year;
  let cursorMonth = firstDate.month;

  while (
    `${cursorYear}-${String(cursorMonth).padStart(2, "0")}` <= lastMonthKey
  ) {
    const key = `${cursorYear}-${String(cursorMonth).padStart(2, "0")}`;
    const dayCount = getDaysInMonth(cursorYear, cursorMonth);
    const firstWeekday = new Date(cursorYear, cursorMonth - 1, 1).getDay();

    const cells: MonthDay[] = [];

    for (let index = 0; index < firstWeekday; index += 1) {
      cells.push({
        date: `blank-${key}-${index}`,
        count: 0,
        blank: true,
      });
    }

    for (let day = 1; day <= dayCount; day += 1) {
      const date = `${cursorYear}-${String(cursorMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      cells.push({
        date,
        count: dayMap.get(date) ?? 0,
        blank: false,
      });
    }

    const trailingBlanks = (7 - (cells.length % 7)) % 7;
    for (let index = 0; index < trailingBlanks; index += 1) {
      cells.push({
        date: `blank-end-${key}-${index}`,
        count: 0,
        blank: true,
      });
    }

    months.push({
      key,
      label: `${monthNames[cursorMonth - 1] ?? key} ${cursorYear}`,
      year: cursorYear,
      month: cursorMonth,
      days: cells,
    });

    const next = addMonths(cursorYear, cursorMonth, 1);
    cursorYear = next.year;
    cursorMonth = next.month;
  }

  return months;
}

export function StreakHeatmap({
  title,
  currentStreak,
  longestStreak,
  days,
  className,
}: StreakHeatmapProps) {
  const monthGroups = useMemo(() => buildMonthGroups(days), [days]);
  const [activeMonthKey, setActiveMonthKey] = useState(() => {
    return monthGroups[monthGroups.length - 1]?.key ?? "";
  });

  useEffect(() => {
    if (!monthGroups.length) {
      return;
    }

    const activeMonthExists = monthGroups.some(
      (month) => month.key === activeMonthKey,
    );

    if (!activeMonthExists) {
      setActiveMonthKey(monthGroups[monthGroups.length - 1].key);
    }
  }, [activeMonthKey, monthGroups]);

  const activeMonthIndex = monthGroups.findIndex(
    (month) => month.key === activeMonthKey,
  );
  const activeMonth = monthGroups[activeMonthIndex] ?? monthGroups[0];

  const getCellRoundClasses = (index: number) => {
    if (!activeMonth || activeMonth.days[index]?.blank) {
      return "";
    }

    const cols = 7;
    const row = Math.floor(index / cols);
    const col = index % cols;

    const isBlankAt = (r: number, c: number) => {
      if (r < 0 || c < 0 || c >= cols) {
        return true;
      }

      const neighborIndex = r * cols + c;
      const neighbor = activeMonth.days[neighborIndex];
      return !neighbor || neighbor.blank;
    };

    const topBlank = isBlankAt(row - 1, col);
    const rightBlank = isBlankAt(row, col + 1);
    const bottomBlank = isBlankAt(row + 1, col);
    const leftBlank = isBlankAt(row, col - 1);

    return cn(
      topBlank && leftBlank && "rounded-tl-md",
      topBlank && rightBlank && "rounded-tr-md",
      bottomBlank && leftBlank && "rounded-bl-md",
      bottomBlank && rightBlank && "rounded-br-md",
    );
  };

  const goToPreviousMonth = () => {
    if (activeMonthIndex > 0) {
      setActiveMonthKey(monthGroups[activeMonthIndex - 1].key);
    }
  };

  const goToNextMonth = () => {
    if (activeMonthIndex >= 0 && activeMonthIndex < monthGroups.length - 1) {
      setActiveMonthKey(monthGroups[activeMonthIndex + 1].key);
    }
  };

  return (
    <section className={`space-y-3 ${className ?? ""}`.trim()}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {title}
        </p>
        <span className="text-xs text-muted-foreground">{currentStreak}d</span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={goToPreviousMonth}
              disabled={activeMonthIndex <= 0}
              aria-label="Previous month"
            >
              ‹
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-8"
              onClick={goToNextMonth}
              disabled={
                activeMonthIndex < 0 ||
                activeMonthIndex >= monthGroups.length - 1
              }
              aria-label="Next month"
            >
              ›
            </Button>
          </div>

          {/* <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1">
            {monthGroups.map((month) => {
              const isActive = month.key === activeMonth?.key;

              return (
                <button
                  key={month.key}
                  type="button"
                  onClick={() => setActiveMonthKey(month.key)}
                  className={[
                    "shrink-0 rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] transition-colors",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  ].join(" ")}
                >
                  {month.label}
                </button>
              );
            })}
          </div> */}
        </div>

        {activeMonth ? (
          <div className="space-y-2 p-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {activeMonth.label}
              </p>
              <span className="text-[10px] text-muted-foreground">
                {activeMonth.days
                  .filter((day) => !day.blank)
                  .reduce((total, day) => total + day.count, 0)}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {activeMonth.days.map((day, index) => (
                <span
                  key={day.date}
                  title={day.blank ? "" : `${day.date} • ${day.count} posts`}
                  aria-hidden={day.blank}
                  className={cn(
                    "aspect-square",
                    day.blank ? "bg-transparent" : getHeatmapTone(day.count),
                    getCellRoundClasses(index),
                  )}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Longest streak: {longestStreak}d
      </p>
    </section>
  );
}
