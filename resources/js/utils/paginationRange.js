/**
 * Builds a page-number window capped at a small, constant size so it always
 * fits on one line: `siblingCount` pages on each side of the current page,
 * plus the last `trailingCount` pages always pinned at the end - with gaps
 * collapsed into '...' (or, if the gap is just a single page, that page is
 * shown instead of a pointless ellipsis). There's no separate "always show
 * page 1, 2, 3" block up front; the current page's own siblings are what
 * cover the start of the list, so the total count of numbers shown stays
 * fixed regardless of where you are.
 *
 * Examples (siblingCount=1, trailingCount=3, total=16):
 *   current=5  -> [4, 5, 6, '...', 14, 15, 16]
 *   current=3  -> [2, 3, 4, '...', 14, 15, 16]
 *   current=1  -> [1, 2, '...', 14, 15, 16]
 *   current=15 -> [13, 14, 15, 16]
 */
export function buildPageList(current, total, { siblingCount = 1, trailingCount = 3 } = {}) {
    if (total <= siblingCount * 2 + trailingCount + 2) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages = new Set();

    for (let i = total - trailingCount + 1; i <= total; i++) pages.add(i);
    for (let i = current - siblingCount; i <= current + siblingCount; i++) {
        if (i >= 1 && i <= total) pages.add(i);
    }

    const sorted = [...pages].sort((a, b) => a - b);
    const withDots = [];
    let prev = null;
    for (const page of sorted) {
        if (prev !== null) {
            if (page - prev === 2) {
                withDots.push(prev + 1);
            } else if (page - prev > 1) {
                withDots.push('...');
            }
        }
        withDots.push(page);
        prev = page;
    }
    return withDots;
}
