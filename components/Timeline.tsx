"use client";

import {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import resumeData from "@/data/resume.json";

type ResumeItem = {
  id: string;
  category: string;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
};

const categoryColors: Record<string, string> = {
  education: "bg-blue-500",
  employment: "bg-green-500",
  project: "bg-purple-500",
  certification: "bg-orange-500",
};

const categoryBorderColors: Record<string, string> = {
  education: "border-blue-500",
  employment: "border-green-500",
  project: "border-purple-500",
  certification: "border-orange-500",
};

// For SVG stroke colors, using hex values directly
const categoryStrokeColors: Record<string, string> = {
  education: "#3b82f6", // blue-500
  employment: "#22c55e", // green-500
  project: "#a855f7", // purple-500
  certification: "#f97316", // orange-500
};

const categoryTextColors: Record<string, string> = {
  education: "text-blue-500",
  employment: "text-green-500",
  project: "text-purple-500",
  certification: "text-orange-500",
};

const categoryBgLight: Record<string, string> = {
  education: "bg-blue-500/10",
  employment: "bg-green-500/10",
  project: "bg-purple-500/10",
  certification: "bg-orange-500/10",
};

const categoryLabels: Record<string, string> = {
  education: "Education",
  employment: "Employment",
  project: "Projects",
  certification: "Certifications",
};

function parseDate(dateStr: string): Date {
  if (dateStr === "present" || dateStr === "future") return new Date();
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1);
}

function parseDateForBounds(dateStr: string): Date {
  if (dateStr === "present") return new Date();
  if (dateStr === "future") {
    const f = new Date();
    f.setMonth(f.getMonth() + 6);
    return f;
  }
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1);
}

function isFutureDate(dateStr: string): boolean {
  if (dateStr === "present" || dateStr === "future") return false;
  return parseDateForBounds(dateStr) > new Date();
}

function formatDateRange(startDate: string, endDate: string): string {
  const fmt = (d: string) => {
    if (d === "present") return "Present";
    if (d === "future") return "Ongoing";
    const date = parseDateForBounds(d);
    const s = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    return isFutureDate(d) ? `${s} (Expected)` : s;
  };
  return `${fmt(startDate)} — ${fmt(endDate)}`;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

type TimeInterval = {
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  items: ResumeItem[];
  key: string;
};

/**
 * Creates coarse-grained intervals for the timeline, merging granular time periods
 * to ensure that no single timeline section is too cluttered.
 * @param items The resume items to display.
 * @param maxItemsPerSection The maximum number of unique items to show in one section.
 * @returns An array of TimeInterval objects representing the sections.
 */
function computeIntervals(
  items: ResumeItem[],
  maxItemsPerSection: number = 6,
): TimeInterval[] {
  const granularIntervals = computeGranularIntervals(items);
  if (granularIntervals.length <= 1) {
    return granularIntervals;
  }

  const mergedIntervals: TimeInterval[] = [];
  let currentMergeGroup: TimeInterval[] = [];

  for (const granular of granularIntervals) {
    const tempGroup = [...currentMergeGroup, granular];
    const uniqueItemIds = new Set(
      tempGroup.flatMap((g) => g.items.map((item) => item.id)),
    );

    if (
      uniqueItemIds.size > maxItemsPerSection &&
      currentMergeGroup.length > 0
    ) {
      // Finalize the previous group because adding the next granular interval would exceed the limit
      const first = currentMergeGroup[0];
      const last = currentMergeGroup[currentMergeGroup.length - 1];
      const allItemIds = new Set(
        currentMergeGroup.flatMap((g) => g.items.map((item) => item.id)),
      );
      const allItems = items.filter((item) => allItemIds.has(item.id));

      mergedIntervals.push({
        start: first.start,
        end: last.end,
        startLabel: first.startLabel,
        endLabel: last.endLabel,
        items: allItems,
        key: `${dateKey(first.start)}-${dateKey(last.end)}`,
      });

      currentMergeGroup = [granular]; // Start a new group
    } else {
      currentMergeGroup.push(granular); // Add to the current group
    }
  }

  // Finalize the last remaining group
  if (currentMergeGroup.length > 0) {
    const first = currentMergeGroup[0];
    const last = currentMergeGroup[currentMergeGroup.length - 1];
    const allItemIds = new Set(
      currentMergeGroup.flatMap((g) => g.items.map((item) => item.id)),
    );
    const allItems = items.filter((item) => allItemIds.has(item.id));

    mergedIntervals.push({
      start: first.start,
      end: last.end,
      startLabel: first.startLabel,
      endLabel: last.endLabel,
      items: allItems,
      key: `${dateKey(first.start)}-${dateKey(last.end)}`,
    });
  }

  return mergedIntervals;
}

/**
 * Creates fine-grained intervals based on every unique start and end date.
 * This forms the basis for the intelligent merging in `computeIntervals`.
 */
function computeGranularIntervals(items: ResumeItem[]): TimeInterval[] {
  if (items.length === 0) return [];

  const dateSet = new Map<string, Date>();
  for (const item of items) {
    const s = parseDate(item.startDate);
    const e = parseDateForBounds(item.endDate);
    const sk = dateKey(s);
    const ek = dateKey(e);
    if (!dateSet.has(sk)) dateSet.set(sk, s);
    if (!dateSet.has(ek)) dateSet.set(ek, e);
  }

  const sortedDates = Array.from(dateSet.values()).sort(
    (a, b) => a.getTime() - b.getTime(),
  );

  const intervals: TimeInterval[] = [];

  for (let i = 0; i < sortedDates.length - 1; i++) {
    const start = sortedDates[i];
    const end = sortedDates[i + 1];

    const active = items.filter((item) => {
      const itemStart = parseDate(item.startDate);
      const itemEnd = parseDateForBounds(item.endDate);
      return itemStart < end && itemEnd > start;
    });

    if (active.length > 0) {
      intervals.push({
        start,
        end,
        startLabel: start.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        endLabel: end.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        items: active,
        key: `${dateKey(start)}-${dateKey(end)}`,
      });
    }
  }

  if (sortedDates.length > 0) {
    const lastDate = sortedDates[sortedDates.length - 1];
    const activeAtEnd = items.filter((item) => {
      const itemEnd = parseDateForBounds(item.endDate);
      return itemEnd >= lastDate;
    });
    if (activeAtEnd.length > 0) {
      intervals.push({
        start: lastDate,
        end: new Date(lastDate.getFullYear() + 1, lastDate.getMonth(), 1),
        startLabel: lastDate.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        endLabel: "Now",
        items: activeAtEnd,
        key: `${dateKey(lastDate)}-end`,
      });
    }
  }

  return intervals;
}

// Constants for sticky positioning.
// Navbar height is approx. 60px (from Navbar.tsx: py-4 + text-xl line-height).
const NAVBAR_HEIGHT = 60;
// Filter bar height is approx. 65px (py-4 + button height + border).
const FILTER_BAR_HEIGHT = 65;
// Total offset for sticky timeline sections.
const TIMELINE_HEADER_OFFSET = NAVBAR_HEIGHT + FILTER_BAR_HEIGHT;

export default function Timeline() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(["education", "employment", "project", "certification"]),
  );
  const [isCondensed, setIsCondensed] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [fontSize, setFontSize] = useState<number | undefined>();

  // Ref declarations
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionContentRefs = useRef<(HTMLDivElement | null)[]>([]); // For dynamic font sizing
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map()); // For item position measurement
  const [itemPositions, setItemPositions] = useState<Map<string, DOMRect>>(
    new Map(),
  ); // Stored item positions
  const containerRectRef = useRef<DOMRect | null>(null); // Container rect captured alongside item positions

  // Memoized calculations (order matters for dependencies)
  // Categories for filter buttons
  // Filtered items based on active filters

  const categories = useMemo(() => {
    const cats = new Set(resumeData.items.map((item) => item.category));
    return Array.from(cats);
  }, []);

  const filteredItems = useMemo(() => {
    return resumeData.items.filter((item) => activeFilters.has(item.category));
  }, [activeFilters]);

  const intervals = useMemo(
    () => computeIntervals(filteredItems),
    [filteredItems],
  );

  // Continuity map for drawing connections between persisting items
  const continuityMap = useMemo(() => {
    const map = new Map<
      number,
      { prevIds: Set<string>; nextIds: Set<string> }
    >();
    for (let i = 0; i < intervals.length; i++) {
      const prevIds =
        i > 0
          ? new Set<string>(intervals[i - 1].items.map((it) => it.id))
          : new Set<string>();
      const nextIds =
        i < intervals.length - 1
          ? new Set<string>(intervals[i + 1].items.map((it) => it.id))
          : new Set<string>();
      map.set(i, { prevIds, nextIds });
    }
    return map;
  }, [intervals]);

  useEffect(() => {
    if (isCondensed || intervals.length === 0) return;

    const calculateSize = () => {
      let minRatio = 1;
      const baseRem = parseFloat(
        getComputedStyle(document.documentElement).fontSize,
      );

      sectionContentRefs.current.forEach((contentEl) => {
        if (contentEl) {
          const container = contentEl.parentElement;
          if (container) {
            contentEl.style.fontSize = "1rem"; // Reset for measurement
            const contentHeight = contentEl.scrollHeight;
            const containerHeight = contentEl.clientHeight; // Use clientHeight of the content div itself

            if (contentHeight > containerHeight) {
              const ratio = containerHeight / contentHeight;
              if (ratio < minRatio) minRatio = ratio;
            }
          }
        }
      });

      const newFontSize = Math.max(1 * minRatio, 12 / baseRem); // 1rem base, min 12px
      setFontSize(newFontSize);
    };

    const handleResize = () => setTimeout(calculateSize, 150);
    window.addEventListener("resize", handleResize);
    handleResize(); // Initial calculation

    return () => window.removeEventListener("resize", handleResize);
  }, [intervals, isCondensed]);

  // Effect to measure item positions (useLayoutEffect for synchronous DOM updates)
  // This ensures itemPositions is updated right after DOM changes (like font size or interval changes)
  useLayoutEffect(() => {
    const newPositions = new Map<string, DOMRect>();
    itemRefs.current.forEach((ref, id) => {
      if (ref) {
        newPositions.set(id, ref.getBoundingClientRect());
      }
    });
    containerRectRef.current =
      containerRef.current?.getBoundingClientRect() || null;
    setItemPositions(newPositions);
  }, [intervals, fontSize]); // Re-measure on interval change or font size change

  const toggleFilter = (category: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(category)) {
      if (newFilters.size > 1) newFilters.delete(category);
    } else {
      newFilters.add(category);
    }
    setActiveFilters(newFilters);
  };

  // Track scroll progress for the progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // The scrollable distance of the timeline container
      const total =
        containerRef.current.scrollHeight -
        window.innerHeight +
        TIMELINE_HEADER_OFFSET;
      const scrolled = -rect.top + TIMELINE_HEADER_OFFSET;
      setScrollProgress(Math.max(0, Math.min(1, scrolled / total)));

      // Capture container rect at the same time as item positions to keep coordinate systems in sync
      containerRectRef.current = rect;

      // Update item positions on scroll for accurate connection drawing
      const newPositions = new Map<string, DOMRect>();
      itemRefs.current.forEach((ref, id) => {
        if (ref) {
          newPositions.set(id, ref.getBoundingClientRect());
        }
      });
      setItemPositions(newPositions);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToInterval = (index: number) => {
    const sections = containerRef.current?.querySelectorAll("[data-pin]");
    if (containerRef.current && sections?.[index]) {
      const element = sections[index] as HTMLElement;
      // Calculate the scroll position to align the top of the section
      // just below the sticky header elements.
      const offsetTop =
        containerRef.current.offsetTop +
        element.offsetTop -
        TIMELINE_HEADER_OFFSET;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  // Add a ref map for the <path> elements themselves
  const pathRefs = useRef(new Map());

  // Continuous rAF sync loop — measures + writes DOM directly, no React state/render in the hot path
  useLayoutEffect(() => {
    // @ts-ignore
    let rafId; 

    const syncPaths = () => {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) {
        rafId = requestAnimationFrame(syncPaths);
        return;
      }

      const updates = []; // batch: collect all reads first

      intervals.forEach((currentInterval, i) => {
        if (i === 0) return;
        const { prevIds } = continuityMap.get(i) || { prevIds: new Set() };
        currentInterval.items.forEach((currentItem) => {
          if (!prevIds.has(currentItem.id)) return;
          const currentItemKey = `${currentItem.id}-${i}`;
          const prevItemKey = `${currentItem.id}-${i - 1}`;
          const currentEl = itemRefs.current.get(currentItemKey);
          const prevEl = itemRefs.current.get(prevItemKey);
          const pathEl = pathRefs.current.get(currentItemKey);
          if (!currentEl || !prevEl || !pathEl) return;

          updates.push({
            pathEl,
            currentRect: currentEl.getBoundingClientRect(), // read
            prevRect: prevEl.getBoundingClientRect(), // read
          });
        });
      });

      // write pass — no reads mixed in
      const svgOffsetX = containerRect.left;
      const svgOffsetY = containerRect.top;
      updates.forEach(({ pathEl, currentRect, prevRect }) => {
        const dotCenterXOffset = 5;
        const dotCenterYOffset = 8 + 6 + 5;
        const startX = prevRect.left + dotCenterXOffset - svgOffsetX;
        const startY = prevRect.top + dotCenterYOffset - svgOffsetY;
        const endX = currentRect.left + dotCenterXOffset - svgOffsetX;
        const endY = currentRect.top + dotCenterYOffset - svgOffsetY;
        const controlY1 = startY + (endY - startY) * 0.3;
        const controlY2 = endY - (endY - startY) * 0.3;
        pathEl.setAttribute(
          "d",
          `M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`,
        );
      });

      rafId = requestAnimationFrame(syncPaths);
    };

    rafId = requestAnimationFrame(syncPaths);
    return () => cancelAnimationFrame(rafId);
  }, [intervals, continuityMap]); // only re-bind if the data itself changes, not on scroll

  return (
    <div
      className="w-full"
      style={
        {
          "--timeline-header-offset": `${TIMELINE_HEADER_OFFSET}px`,
        } as React.CSSProperties
      }
    >
      {/* Filter Controls */}
      <div
        className="sticky z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md py-4 px-6 mb-0 border-b border-zinc-200 dark:border-zinc-800"
        style={{ top: `${NAVBAR_HEIGHT}px` }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Filter:
          </span>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => toggleFilter(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeFilters.has(category)
                  ? `${categoryColors[category]} text-white`
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
              }`}
            >
              {categoryLabels[category]}
            </button>
          ))}
          <div className="ml-auto">
            <button
              onClick={() => setIsCondensed(!isCondensed)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                isCondensed
                  ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
                  : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
              }`}
            >
              {isCondensed ? "Timeline View" : "Condensed Resume"}
            </button>
          </div>
        </div>

        {/* Global progress bar */}
        <div
          className="fixed left-0 right-0 z-50 h-0.5 bg-zinc-200/50 dark:bg-zinc-800/50"
          style={{ top: `${NAVBAR_HEIGHT}px` }}
        >
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress * 100}%` }}
          />
        </div>
      </div>

      {isCondensed ? (
        <CondensedResume items={filteredItems} />
      ) : (
        <div ref={containerRef} className="relative">
          {/* Progress dots (right side) */}
          <div className="fixed right-4 md:right-6 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center gap-1">
            {intervals.map((interval, i) => {
              const sectionElement = containerRef.current?.querySelectorAll(
                "[data-pin]",
              )[i] as HTMLElement;
              // Calculate the progress value that corresponds to the start of this section
              const totalScrollHeight = containerRef.current
                ? containerRef.current.scrollHeight -
                  window.innerHeight +
                  TIMELINE_HEADER_OFFSET
                : 0;
              const sectionStart = sectionElement
                ? sectionElement.offsetTop
                : 0;
              const progress =
                totalScrollHeight > 0 ? sectionStart / totalScrollHeight : 0;
              const dist = Math.abs(scrollProgress - progress);
              const isActive = dist < 0.15;
              return (
                <button
                  key={interval.key}
                  onClick={() => scrollToInterval(i)}
                  className="group flex items-center gap-2 py-0.5"
                  title={`${interval.startLabel} — ${interval.endLabel}`}
                >
                  <span
                    className={`text-[10px] font-mono whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? "opacity-100 text-zinc-900 dark:text-white"
                        : "opacity-0 group-hover:opacity-70 text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {interval.startLabel}
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? `${categoryColors[interval.items[0]?.category]} scale-150 shadow-lg`
                        : "bg-zinc-300 dark:bg-zinc-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Connection SVG layer — paths are created once per persisting item, then mutated directly each frame */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {intervals.map((currentInterval, i) => {
              if (i === 0) return null;
              const { prevIds } = continuityMap.get(i) || {
                prevIds: new Set(),
              };

              return currentInterval.items.map((currentItem) => {
                if (!prevIds.has(currentItem.id)) return null;
                const currentItemKey = `${currentItem.id}-${i}`;

                return (
                  <path
                    key={`${currentItem.id}-connection-${i}`}
                    ref={(el) => {
                      if (el) pathRefs.current.set(currentItemKey, el);
                      else pathRefs.current.delete(currentItemKey);
                    }}
                    d="" // written every frame by the rAF loop above
                    stroke={categoryStrokeColors[currentItem.category]}
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                );
              });
            })}
          </svg>

          {/* Sticky pin sections */}
          {intervals.map((interval, sectionIndex) => {
            return (
              <div key={interval.key} data-pin className="h-[175vh]">
                <section
                  className="sticky w-full h-[calc(100vh-var(--timeline-header-offset))]"
                  style={{
                    zIndex: sectionIndex + 1,
                    top: "var(--timeline-header-offset)",
                  }}
                >
                  {/* Solid background to cover previous pinned section */}
                  <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-950" />

                  {/* Subtle category gradient overlay */}
                  <div className="absolute inset-0 pointer-events-none">
                    {(() => {
                      const dominant = interval.items[0]?.category;
                      const gradients: Record<string, string> = {
                        education:
                          "from-blue-500/[0.03] via-transparent to-blue-500/[0.01]",
                        employment:
                          "from-green-500/[0.03] via-transparent to-green-500/[0.01]",
                        project:
                          "from-purple-500/[0.03] via-transparent to-purple-500/[0.01]",
                        certification:
                          "from-orange-500/[0.03] via-transparent to-orange-500/[0.01]",
                      };
                      return (
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${
                            gradients[dominant] || gradients.project
                          }`}
                        />
                      );
                    })()}
                  </div>

                  {/* Content wrapper */}
                  <div className="relative flex h-full">
                    {/* Main content area */}
                    <div className="w-full h-full p-6 md:p-12">
                      <div
                        className="w-full mx-auto"
                        ref={(el) =>
                          (sectionContentRefs.current[sectionIndex] = el)
                        }
                        style={{
                          fontSize: fontSize ? `${fontSize}rem` : undefined,
                        }}
                      >
                        {/* Mobile date header (shown on small screens) */}
                        <div className="md:hidden mb-8">
                          <span className="text-4xl font-bold text-zinc-200 dark:text-zinc-800 leading-none select-none">
                            {interval.start.getFullYear()}
                          </span>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
                            {interval.startLabel} — {interval.endLabel}
                          </p>
                          <div className="h-px bg-gradient-to-r from-zinc-300 dark:from-zinc-700 to-transparent mt-4" />
                        </div>

                        {/* Desktop date header */}
                        <div className="hidden md:block mb-10">
                          <div className="flex items-baseline gap-4">
                            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              {interval.startLabel}
                            </span>
                            <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800" />
                            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                              {interval.endLabel}
                            </span>
                          </div>
                        </div>

                        {/* Items grid */}
                        <div className="grid portrait:grid-cols-1 portrait:grid-flow-row landscape:grid-flow-col lg:landscape:grid-flow-col gap-4">
                          {interval.items.map((item) => (
                            <TimelineItemEntry
                              key={item.id}
                              item={item}
                              itemRef={(el) => {
                                const key = `${item.id}-${sectionIndex}`;
                                if (el) itemRefs.current.set(key, el);
                                else itemRefs.current.delete(key);
                              }}
                            />
                          ))}
                        </div>

                        {/* Section counter */}
                        <div className="mt-12 text-center">
                          <span className="text-xs font-mono text-zinc-300 dark:text-zinc-700">
                            {String(sectionIndex + 1).padStart(2, "0")} /{" "}
                            {String(intervals.length).padStart(2, "0")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TimelineItemEntry({
  item,
  itemRef,
}: {
  item: ResumeItem;
  itemRef: React.Ref<HTMLDivElement>;
}) {
  const hasFutureEnd = isFutureDate(item.endDate) || item.endDate === "future";

  return (
    <div ref={itemRef} className="relative py-2">
      <div className="flex items-start gap-4">
        <span
          className={`mt-1.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            categoryColors[item.category]
          }`}
        />
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 dark:text-white leading-snug">
            {item.title}
          </h3>
          <p className="font-medium text-zinc-700 dark:text-zinc-400">
            {item.organization}
          </p>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">
            {item.location} · {formatDateRange(item.startDate, item.endDate)}
          </p>
          {item.description && (
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              {item.description}
            </p>
          )}
          {item.highlights.length > 0 && (
            <ul className="mt-2 space-y-1 text-zinc-600 dark:text-zinc-400">
              {item.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-zinc-400 dark:text-zinc-500">·</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function CondensedResume({ items }: { items: ResumeItem[] }) {
  const groupedItems = useMemo(() => {
    const groups: Record<string, ResumeItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const categoryOrder = ["employment", "education", "project", "certification"];

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-8 max-w-3xl mx-auto my-12">
      <div className="text-center mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-700">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          {resumeData.profile.name}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-2">
          {resumeData.profile.title}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {resumeData.profile.email} · {resumeData.profile.location}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-zinc-500" />
          Skills
        </h2>
        <div className="flex flex-wrap gap-2">
          {resumeData.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {categoryOrder.map((category) => {
        const categoryItems = groupedItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${categoryColors[category]}`}
              />
              {categoryLabels[category]}
            </h2>
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <div
                  key={item.id}
                  className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-700"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap ml-4">
                      {formatDateRange(item.startDate, item.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-1">
                    {item.organization} · {item.location}
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.highlights.map((highlight, i) => (
                      <li key={i}>· {highlight}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
