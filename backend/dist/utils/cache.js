"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cache = new Map();
function get(key) {
    const entry = cache.get(key);
    if (!entry)
        return undefined;
    if (Date.now() > entry.expires) {
        cache.delete(key);
        return undefined;
    }
    return entry.value;
}
function set(key, value, ttl) {
    cache.set(key, { value, expires: Date.now() + ttl });
}
exports.default = { get, set };
//# sourceMappingURL=cache.js.map