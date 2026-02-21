/**
 * Cache Utility
 * Simple in-memory caching with TTL support
 * Used for frequently accessed data to improve performance
 */

class Cache {
  constructor(defaultTTL = 3600000) { // 1 hour default
    this.store = new Map();
    this.defaultTTL = defaultTTL;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  /**
   * Set a value in cache
   * @param {string} key
   * @param {*} value
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
    this.stats.sets++;
  }

  /**
   * Get a value from cache
   * @param {string} key
   * @returns {*|null} Cached value or null if expired/missing
   */
  get(key) {
    const item = this.store.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete a value from cache
   * @param {string} key
   */
  delete(key) {
    this.store.delete(key);
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.store.clear();
  }

  /**
   * Get cache statistics
   * @returns {object} Stats object
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      total,
      hitRate: `${hitRate}%`,
      itemsInCache: this.store.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = { hits: 0, misses: 0, sets: 0 };
  }
}

// Create singleton cache instance
const cache = new Cache();

module.exports = cache;
