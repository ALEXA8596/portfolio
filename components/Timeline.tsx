"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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

const categoryLabels: Record<string, string> = {
  education: "Education",
  employment: "Employment",
  project: "Projects",
  certification: "Certifications",
};

function parseDate(dateStr: string): Date {
  if (dateStr === "present" || dateStr === "future") {
    return new Date();
  }
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1);
}

// Parse date for timeline bounds - includes future dates
function parseDateForBounds(dateStr: string): Date {
  if (dateStr === "present") {
    return new Date();
  }
  if (dateStr === "future") {
    // Extend 6 months into the future for "future" items
    const future = new Date();
    future.setMonth(future.getMonth() + 6);
    return future;
  }
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1);
}

// Check if a date extends into the future
function isFutureDate(dateStr: string): boolean {
  if (dateStr === "present") return false;
  if (dateStr === "future") return true;
  const date = parseDateForBounds(dateStr);
  return date > new Date();
}

function getMonthsDuration(startDate: string, endDate: string): number {
  const start = parseDate(startDate);
  const end = parseDateForBounds(endDate);
  const months =
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatDate = (dateStr: string) => {
    if (dateStr === "present") return "Present";
    if (dateStr === "future") return "Ongoing";
    const date = parseDateForBounds(dateStr);
    const formatted = date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    // Add indicator if date is in the future
    if (isFutureDate(dateStr)) {
      return `${formatted} (Expected)`;
    }
    return formatted;
  };
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

const DEFAULT_PIXELS_PER_MONTH = 16; // Default scale: 16 pixels per month
const MIN_ITEM_HEIGHT = 60; // Minimum height in pixels

type ZoomZone = {
  startYear: number;
  endYear: number;
  multiplier: number; // Scale multiplier for this zone (e.g., 2 = 2x zoom)
};

type ItemLayout = {
  column: number;
  localColumnCount: number; // How many columns are active at this item's position
  localColumnOffset: number; // The adjusted column index for centering
};

// Assign items to columns and calculate local column counts for centering
function assignColumnsWithLayout(
  items: ResumeItem[],
  minDate: Date,
  minVisualMonths: number
): Map<string, ItemLayout> {
  const layouts = new Map<string, ItemLayout>();
  // Track the visual end position (in months from minDate) for each column
  const columnVisualEnds: number[] = [];
  
  // Store each item's visual bounds for later overlap calculation
  const itemBounds: { id: string; start: number; end: number; column: number }[] = [];

  // Sort items by start date (earliest first)
  const sortedItems = [...items].sort(
    (a, b) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime()
  );

  // First pass: assign columns
  for (const item of sortedItems) {
    const itemStart = parseDate(item.startDate);
    const itemStartMonths =
      (itemStart.getFullYear() - minDate.getFullYear()) * 12 +
      (itemStart.getMonth() - minDate.getMonth());
    
    // Calculate the visual end position (accounting for minimum height)
    const actualDuration = getMonthsDuration(item.startDate, item.endDate);
    const visualDuration = Math.max(minVisualMonths, actualDuration);
    const itemVisualEnd = itemStartMonths + visualDuration;

    // Find first available column (where the item doesn't visually overlap)
    let assignedColumn = -1;
    for (let col = 0; col < columnVisualEnds.length; col++) {
      if (columnVisualEnds[col] <= itemStartMonths) {
        assignedColumn = col;
        break;
      }
    }

    // If no column available, create a new one
    if (assignedColumn === -1) {
      assignedColumn = columnVisualEnds.length;
      columnVisualEnds.push(0);
    }

    // Update the column's visual end position
    columnVisualEnds[assignedColumn] = itemVisualEnd;
    
    itemBounds.push({
      id: item.id,
      start: itemStartMonths,
      end: itemVisualEnd,
      column: assignedColumn,
    });
  }

  const totalColumns = columnVisualEnds.length;

  // Second pass: calculate local column counts for each item
  for (const item of itemBounds) {
    // Find all items that overlap with this item's time range
    const overlappingItems = itemBounds.filter(
      (other) => other.start < item.end && other.end > item.start
    );
    
    // Get unique columns used by overlapping items
    const usedColumns = new Set(overlappingItems.map((i) => i.column));
    const localColumnCount = usedColumns.size;
    
    // Sort used columns to find this item's position within the local group
    const sortedColumns = Array.from(usedColumns).sort((a, b) => a - b);
    const localColumnOffset = sortedColumns.indexOf(item.column);
    
    layouts.set(item.id, {
      column: item.column,
      localColumnCount,
      localColumnOffset,
    });
  }

  return layouts;
}

export default function Timeline() {
  const [activeFilters, setActiveFilters] = useState<Set<string>>(
    new Set(["education", "employment", "project", "certification"])
  );
  const [isCondensed, setIsCondensed] = useState(false);
  const [isReversed, setIsReversed] = useState(false);
  const [pixelsPerMonth, setPixelsPerMonth] = useState(DEFAULT_PIXELS_PER_MONTH);
  const [zoomZones, setZoomZones] = useState<ZoomZone[]>([]);
  const [isAddingZone, setIsAddingZone] = useState(false);
  const [newZoneStart, setNewZoneStart] = useState<number>(2024);
  const [newZoneEnd, setNewZoneEnd] = useState<number>(2026);
  const [newZoneMultiplier, setNewZoneMultiplier] = useState<number>(2);

  const minVisualMonths = MIN_ITEM_HEIGHT / pixelsPerMonth;

  const categories = useMemo(() => {
    const cats = new Set(resumeData.items.map((item) => item.category));
    return Array.from(cats);
  }, []);

  const filteredItems = useMemo(() => {
    return resumeData.items.filter((item) => activeFilters.has(item.category));
  }, [activeFilters]);

  const toggleFilter = (category: string) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(category)) {
      if (newFilters.size > 1) {
        newFilters.delete(category);
      }
    } else {
      newFilters.add(category);
    }
    setActiveFilters(newFilters);
  };

  // Calculate timeline bounds (including future dates)
  const { minDate, maxDate, totalMonths } = useMemo(() => {
    if (filteredItems.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), totalMonths: 0 };
    }
    const startDates = filteredItems.map((item) => parseDate(item.startDate));
    const endDates = filteredItems.map((item) => parseDateForBounds(item.endDate));
    const allDates = [...startDates, ...endDates];
    const min = new Date(Math.min(...allDates.map((d) => d.getTime())));
    const max = new Date(Math.max(...allDates.map((d) => d.getTime())));
    const months =
      (max.getFullYear() - min.getFullYear()) * 12 +
      (max.getMonth() - min.getMonth()) +
      1;
    return { minDate: min, maxDate: max, totalMonths: months };
  }, [filteredItems]);

  // Assign columns for overlapping items with layout info for centering
  const itemLayouts = useMemo(
    () => assignColumnsWithLayout(filteredItems, minDate, minVisualMonths),
    [filteredItems, minDate, minVisualMonths]
  );

  const numColumns = useMemo(() => {
    if (itemLayouts.size === 0) return 1;
    return Math.max(...Array.from(itemLayouts.values()).map((l) => l.column)) + 1;
  }, [itemLayouts]);

  // Calculate the scale for a given month (accounting for zoom zones)
  const getScaleForMonth = (monthIndex: number): number => {
    const date = new Date(minDate.getFullYear(), minDate.getMonth() + monthIndex, 1);
    const year = date.getFullYear();
    
    for (const zone of zoomZones) {
      if (year >= zone.startYear && year <= zone.endYear) {
        return pixelsPerMonth * zone.multiplier;
      }
    }
    return pixelsPerMonth;
  };

  // Calculate total height with zoom zones
  const totalHeight = useMemo(() => {
    let height = 0;
    for (let i = 0; i < totalMonths; i++) {
      height += getScaleForMonth(i);
    }
    return height;
  }, [totalMonths, pixelsPerMonth, zoomZones, minDate]);

  // Calculate the pixel offset for a given month from the start
  const getPixelOffsetForMonth = (monthIndex: number): number => {
    let offset = 0;
    for (let i = 0; i < monthIndex; i++) {
      offset += getScaleForMonth(i);
    }
    return offset;
  };

  // Generate year markers for the scale
  const yearMarkers = useMemo(() => {
    const markers: { year: number; offset: number; isZoomed: boolean }[] = [];
    const startYear = minDate.getFullYear();
    const endYear = maxDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      const yearDate = new Date(year, 0, 1);
      const monthsFromStart =
        (yearDate.getFullYear() - minDate.getFullYear()) * 12 +
        (yearDate.getMonth() - minDate.getMonth());
      const normalOffset = getPixelOffsetForMonth(Math.max(0, monthsFromStart));
      const isZoomed = zoomZones.some(z => year >= z.startYear && year <= z.endYear);
      markers.push({
        year,
        offset: isReversed ? totalHeight - normalOffset : normalOffset,
        isZoomed,
      });
    }
    return markers;
  }, [minDate, maxDate, isReversed, totalHeight, zoomZones]);

  // Calculate position and height for each item (with zoom zones)
  const getItemStyle = (item: ResumeItem) => {
    const start = parseDate(item.startDate);
    const monthsFromStart =
      (start.getFullYear() - minDate.getFullYear()) * 12 +
      (start.getMonth() - minDate.getMonth());
    const duration = getMonthsDuration(item.startDate, item.endDate);
    
    // Calculate height by summing scale for each month the item spans
    let height = 0;
    for (let i = 0; i < duration; i++) {
      height += getScaleForMonth(monthsFromStart + i);
    }
    height = Math.max(MIN_ITEM_HEIGHT, height);

    const topOffset = getPixelOffsetForMonth(monthsFromStart);
    
    // If reversed, calculate position from the bottom
    const top = isReversed ? totalHeight - topOffset - height : topOffset;

    return {
      top,
      height,
    };
  };

  const addZoomZone = () => {
    if (newZoneStart <= newZoneEnd) {
      setZoomZones([...zoomZones, { startYear: newZoneStart, endYear: newZoneEnd, multiplier: newZoneMultiplier }]);
      setIsAddingZone(false);
    }
  };

  const removeZoomZone = (index: number) => {
    setZoomZones(zoomZones.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      {/* Filter Controls */}
      <div className="sticky top-20 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md py-4 px-6 mb-8 border-b border-zinc-200 dark:border-zinc-800">
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
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => setIsReversed(!isReversed)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center gap-1.5"
              title={isReversed ? "Show oldest first" : "Show newest first"}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isReversed ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
              {isReversed ? "Newest First" : "Oldest First"}
            </button>
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

        {/* Scale Controls */}
        {!isCondensed && (
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
            {/* Scale Adjustment */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Scale:</span>
              <button
                onClick={() => setPixelsPerMonth(Math.max(2, pixelsPerMonth - 2))}
                className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center text-lg font-bold"
              >
                −
              </button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400 w-12 text-center">
                {pixelsPerMonth}px/mo
              </span>
              <button
                onClick={() => setPixelsPerMonth(Math.min(24, pixelsPerMonth + 2))}
                className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center text-lg font-bold"
              >
                +
              </button>
              <button
                onClick={() => setPixelsPerMonth(DEFAULT_PIXELS_PER_MONTH)}
                className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              >
                Reset
              </button>
            </div>

            {/* Zoom Zones */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Zoom Zones:</span>
              {zoomZones.map((zone, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                >
                  <span>{zone.startYear}-{zone.endYear} ({zone.multiplier}x)</span>
                  <button
                    onClick={() => removeZoomZone(index)}
                    className="ml-1 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
              {!isAddingZone ? (
                <button
                  onClick={() => setIsAddingZone(true)}
                  className="px-3 py-1 rounded-full text-sm bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                >
                  + Add Zone
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg">
                  <input
                    type="number"
                    value={newZoneStart}
                    onChange={(e) => setNewZoneStart(parseInt(e.target.value) || 2020)}
                    className="w-16 px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
                    placeholder="Start"
                  />
                  <span className="text-zinc-500">-</span>
                  <input
                    type="number"
                    value={newZoneEnd}
                    onChange={(e) => setNewZoneEnd(parseInt(e.target.value) || 2026)}
                    className="w-16 px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
                    placeholder="End"
                  />
                  <select
                    value={newZoneMultiplier}
                    onChange={(e) => setNewZoneMultiplier(parseFloat(e.target.value))}
                    className="px-2 py-1 text-xs rounded border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-700"
                  >
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                    <option value={3}>3x</option>
                    <option value={4}>4x</option>
                  </select>
                  <button
                    onClick={addZoomZone}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setIsAddingZone(false)}
                    className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Timeline / Condensed View */}
      {isCondensed ? (
        <CondensedResume items={filteredItems} />
      ) : (
        <div className="relative flex">
          {/* Year Scale */}
          <div
            className="relative w-16 flex-shrink-0 border-r border-zinc-300 dark:border-zinc-700"
            style={{ height: `${totalHeight}px` }}
          >
            {yearMarkers.map(({ year, offset, isZoomed }) => (
              <div
                key={year}
                className="absolute left-0 right-0 flex items-center"
                style={{ top: `${offset}px` }}
              >
                <span className={`text-xs font-medium pr-2 ${isZoomed ? "text-blue-500 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"}`}>
                  {year}
                  {isZoomed && <span className="ml-0.5 text-[8px]">🔍</span>}
                </span>
                <div className={`flex-1 h-px ${isZoomed ? "bg-blue-300 dark:bg-blue-600" : "bg-zinc-300 dark:bg-zinc-600"}`} />
              </div>
            ))}
            {/* Month ticks */}
            {Array.from({ length: totalMonths }).map((_, i) => {
              const monthDate = new Date(
                minDate.getFullYear(),
                minDate.getMonth() + i,
                1
              );
              const isJanuary = monthDate.getMonth() === 0;
              if (isJanuary) return null; // Already have year marker
              const offset = getPixelOffsetForMonth(i);
              const isZoomed = zoomZones.some(z => monthDate.getFullYear() >= z.startYear && monthDate.getFullYear() <= z.endYear);
              return (
                <div
                  key={i}
                  className={`absolute right-0 w-2 h-px ${isZoomed ? "bg-blue-200 dark:bg-blue-700" : "bg-zinc-200 dark:bg-zinc-700"}`}
                  style={{ top: `${offset}px` }}
                />
              );
            })}
          </div>

          {/* Timeline Columns */}
          <div
            className="relative flex-1 ml-4"
            style={{ height: `${totalHeight}px` }}
          >
            {/* Horizontal year lines */}
            {yearMarkers.map(({ year, offset }) => (
              <div
                key={year}
                className="absolute left-0 right-0 h-px bg-zinc-200 dark:bg-zinc-700"
                style={{ top: `${offset}px` }}
              />
            ))}

            {/* Timeline items */}
            {filteredItems.map((item) => {
              const layout = itemLayouts.get(item.id) || { column: 0, localColumnCount: 1, localColumnOffset: 0 };
              const { top, height } = getItemStyle(item);
              
              // Calculate width and position based on local column count (items overlapping at this position)
              const columnWidthPercent = Math.min(100 / numColumns, 50); // Cap at 50% width per item
              const localTotalWidth = columnWidthPercent * layout.localColumnCount;
              const centerOffset = (100 - localTotalWidth) / 2;
              const leftPosition = centerOffset + layout.localColumnOffset * columnWidthPercent;

              return (
                <div
                  key={item.id}
                  className="absolute px-1"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `${leftPosition}%`,
                    width: `${columnWidthPercent}%`,
                  }}
                >
                  <TimelineCard item={item} height={height} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineCard({ item, height }: { item: ResumeItem; height: number }) {
  const [isHovered, setIsHovered] = useState(false);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const hasFutureEnd = isFutureDate(item.endDate) || item.endDate === "future";

  // Height thresholds for showing different elements (in pixels)
  // Priority: title > organization > date range > category label > description > highlights
  const showCategory = isHovered || height >= 40;
  const showTitle = true; // Always show title
  const showOrganization = isHovered || height >= 55;
  const showDateRange = isHovered || height >= 75;
  const showDescription = isHovered || height >= 120;
  const showHighlights = isHovered || height >= 150;

  // Calculate popup position to keep it within viewport
  const calculatePopupPosition = useCallback(() => {
    if (!cardRef.current || !popupRef.current || !isHovered) return;

    const cardRect = cardRef.current.getBoundingClientRect();
    const popupRect = popupRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 10; // Padding from viewport edges

    const newStyle: React.CSSProperties = {};

    // Check if popup extends below viewport
    if (popupRect.bottom > viewportHeight - padding) {
      const overflow = popupRect.bottom - (viewportHeight - padding);
      // First try moving it up
      if (cardRect.top - overflow > padding) {
        newStyle.transform = `translateY(-${overflow}px) scale(1.02)`;
      } else {
        // If can't move up enough, limit max height and allow scroll
        const maxHeight = viewportHeight - padding * 2 - 20;
        newStyle.maxHeight = `${maxHeight}px`;
        newStyle.overflowY = "auto";
      }
    }

    // Check if popup extends above viewport
    if (cardRect.top < padding) {
      const overflow = padding - cardRect.top;
      newStyle.transform = `translateY(${overflow}px) scale(1.02)`;
    }

    // Check horizontal overflow (right side)
    if (popupRect.right > viewportWidth - padding) {
      const overflow = popupRect.right - (viewportWidth - padding);
      newStyle.marginLeft = `-${overflow}px`;
    }

    // Check horizontal overflow (left side)
    if (popupRect.left < padding) {
      const overflow = padding - popupRect.left;
      newStyle.marginLeft = `${overflow}px`;
    }

    setPopupStyle(newStyle);
  }, [isHovered]);

  useEffect(() => {
    if (isHovered) {
      // Small delay to let the popup render first
      const timer = setTimeout(calculatePopupPosition, 50);
      return () => clearTimeout(timer);
    } else {
      setPopupStyle({});
    }
  }, [isHovered, calculatePopupPosition]);

  return (
    <div ref={cardRef} className="relative h-full">
      {/* Original card (non-hovered state) */}
      <div
        className={`h-full bg-white dark:bg-zinc-800 rounded-lg border-l-4 ${categoryBorderColors[item.category]} border border-zinc-200 dark:border-zinc-700 ${hasFutureEnd ? "border-dashed" : ""} transition-all duration-300 ease-out shadow-sm hover:shadow-md`}
        onMouseEnter={() => setIsHovered(true)}
      >
        <div className="p-3 flex flex-col overflow-hidden h-full">
          <div 
            className={`flex items-center gap-1.5 mb-1 overflow-hidden flex-shrink-0 transition-all duration-300 ease-out ${showCategory && !isHovered ? "opacity-100 max-h-6" : "opacity-0 max-h-0 mb-0"}`}
          >
            <span
              className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${categoryColors[item.category]}`}
            />
            <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide overflow-hidden whitespace-nowrap">
              {categoryLabels[item.category]}
              {hasFutureEnd && " • Ongoing"}
            </span>
          </div>
          {showTitle && (
            <h3 
              className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight flex-shrink-0 line-clamp-1 break-words"
            >
              {item.title}
            </h3>
          )}
          <p 
            className={`text-xs text-zinc-600 dark:text-zinc-300 flex-shrink-0 transition-all duration-300 ease-out line-clamp-1 break-words ${showOrganization && !isHovered ? "opacity-100 max-h-10" : "opacity-0 max-h-0 overflow-hidden"}`}
          >
            {item.organization}
          </p>
          <p 
            className={`text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 overflow-hidden whitespace-nowrap flex-shrink-0 transition-all duration-300 ease-out ${showDateRange && !isHovered ? "opacity-100 max-h-6" : "opacity-0 max-h-0 mt-0"}`}
          >
            {formatDateRange(item.startDate, item.endDate)}
          </p>
          {item.description && (
            <p 
              className={`text-xs text-zinc-600 dark:text-zinc-400 mt-2 flex-grow transition-all duration-300 ease-out line-clamp-2 break-words ${showDescription && !isHovered ? "opacity-100" : "opacity-0 max-h-0 mt-0 overflow-hidden"}`}
            >
              {item.description}
            </p>
          )}
          {item.highlights.length > 0 && (
            <ul 
              className={`text-xs text-zinc-500 dark:text-zinc-400 mt-2 space-y-0.5 overflow-hidden transition-all duration-300 ease-out ${showHighlights && !isHovered ? "opacity-100" : "opacity-0 max-h-0 mt-0"}`}
            >
              {item.highlights.slice(0, Math.floor((height - 120) / 20)).map((highlight, i) => (
                <li key={i} className="line-clamp-1 break-words">
                  • {highlight}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Hover popup - positioned to stay within viewport */}
      {isHovered && (
        <div
          ref={popupRef}
          className={`absolute left-0 right-0 bg-white dark:bg-zinc-800 rounded-lg border-l-4 ${categoryBorderColors[item.category]} border border-zinc-200 dark:border-zinc-700 ${hasFutureEnd ? "border-dashed" : ""} shadow-2xl z-50 ring-2 ring-blue-400/50 transition-all duration-300 ease-out`}
          style={{
            top: 0,
            minHeight: `${height}px`,
            transform: popupStyle.transform || "scale(1.02)",
            transformOrigin: "center top",
            ...popupStyle,
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="p-3 flex flex-col">
            <div className="flex items-center gap-1.5 mb-1 flex-shrink-0">
              <span
                className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${categoryColors[item.category]}`}
              />
              <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {categoryLabels[item.category]}
                {hasFutureEnd && " • Ongoing"}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight flex-shrink-0">
              {item.title}
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 flex-shrink-0">
              {item.organization}
            </p>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 flex-shrink-0">
              {formatDateRange(item.startDate, item.endDate)}
            </p>
            {item.description && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 whitespace-pre-wrap">
                {item.description}
              </p>
            )}
            {item.highlights.length > 0 && (
              <ul className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 space-y-0.5">
                {item.highlights.map((highlight, i) => (
                  <li key={i}>• {highlight}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CondensedResume({ items }: { items: ResumeItem[] }) {
  const groupedItems = useMemo(() => {
    const groups: Record<string, ResumeItem[]> = {};
    items.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return groups;
  }, [items]);

  const categoryOrder = ["employment", "education", "project", "certification"];

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8 pb-6 border-b border-zinc-200 dark:border-zinc-700">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">
          {resumeData.profile.name}
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-300 mb-2">
          {resumeData.profile.title}
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {resumeData.profile.email} • {resumeData.profile.location}
        </p>
      </div>

      {/* Skills */}
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

      {/* Sections */}
      {categoryOrder.map((category) => {
        const categoryItems = groupedItems[category];
        if (!categoryItems || categoryItems.length === 0) return null;

        return (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${categoryColors[category]}`} />
              {categoryLabels[category]}
            </h2>
            <div className="space-y-4">
              {categoryItems.map((item) => (
                <div key={item.id} className="pl-4 border-l-2 border-zinc-200 dark:border-zinc-700">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-zinc-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap ml-4">
                      {formatDateRange(item.startDate, item.endDate)}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-1">
                    {item.organization} • {item.location}
                  </p>
                  <ul className="text-sm text-zinc-500 dark:text-zinc-400">
                    {item.highlights.map((highlight, i) => (
                      <li key={i}>• {highlight}</li>
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