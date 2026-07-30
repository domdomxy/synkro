/**
 * Recharts' <YAxis> reserves a fixed 60px by default regardless of how wide
 * the tick labels actually are. On narrow/mobile screens that's a big chunk
 * of dead space when the values are just single digits. This computes a
 * width from the longest tick label actually present in the data, with a
 * small floor so single-digit values stay compact, and only grows past that
 * once the numbers need more room.
 *
 * @param {Array<Record<string, number>>} chartData
 * @param {string[]} keys - the dataKeys plotted on the chart
 * @returns {number} pixel width to pass to <YAxis width={...} />
 */
export function computeYAxisWidth(chartData, keys) {
    if (!chartData?.length || !keys?.length) return 22;

    let maxValue = 0;
    for (const row of chartData) {
        for (const key of keys) {
            const value = row?.[key];
            if (typeof value === 'number' && value > maxValue) maxValue = value;
        }
    }

    const digits = String(Math.round(maxValue)).length;
    // ~7px per digit plus a small fixed padding for the axis line/tick gap.
    return Math.max(22, digits * 7 + 14);
}
