
export function localDateTimeToIso(value) {
    if (!value) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toISOString();
}
