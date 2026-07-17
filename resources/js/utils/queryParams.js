/**
 * Strips empty strings, null/undefined, and values matching their default
 * from a params object before it's handed to router.get(). Keeps admin list
 * URLs clean (no `?search=&status=all&per_page=10` clutter) while still
 * letting Laravel's withQueryString() carry forward whatever's left.
 *
 * @param {Object} params - key/value pairs to be cleaned
 * @param {Object} defaults - key/value pairs considered "no filter applied"
 */
export function cleanParams(params, defaults = {}) {
    const result = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        if (value === '') continue;
        if (Object.prototype.hasOwnProperty.call(defaults, key) && value === defaults[key]) continue;
        result[key] = value;
    }
    return result;
}
