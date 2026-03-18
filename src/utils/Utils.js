export function removeUndefined(obj) {
    if (Array.isArray(obj)) {
        return obj.map(removeUndefined);
    } else if (obj && typeof obj === "object") {
        const clean = {};
        Object.keys(obj).forEach(k => {
            if (obj[k] !== undefined) {
                clean[k] = removeUndefined(obj[k]);
            }
        });
        return clean;
    }
    return obj;
}