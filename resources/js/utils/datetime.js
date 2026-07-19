/**
 * <input type="datetime-local"> gives back a naive string like "2026-07-20T09:00:00"
 * with no timezone info. If sent to the server as-is, Laravel parses it using the
 * server's own timezone — not the device's — so a task due "9:00 AM" for someone in
 * Tunis could get stored as 9:00 AM UTC (i.e. 10:00 AM their time), silently off by
 * whatever the server/device offset is.
 *
 * The JS Date constructor treats a date-time string with no timezone designator as
 * local time (per the spec), so round-tripping it through `new Date(value)` correctly
 * captures the instant the device's clock actually meant, then `.toISOString()` gives
 * Laravel an unambiguous UTC instant to store — no backend changes needed.
 */
export function localDateTimeToIso(value) {
    if (!value) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString();
}
