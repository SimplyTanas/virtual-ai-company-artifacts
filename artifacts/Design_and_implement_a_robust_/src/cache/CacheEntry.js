// src/cache/CacheEntry.js

export class CacheEntry {
  /**
   * @param {*} value - the cached value
   * @param {number|null} ttlMs - time‑to‑live in milliseconds, null = infinite
   * @param {Object} node - reference to the node in the LRU list
   */
  constructor(value, ttlMs, node) {
    this.value = value;
    this.node = node;
    this.expiresAt = ttlMs != null ? Date.now() + ttlMs : null;
  }

  /** @returns {boolean} true if entry is expired */
  isExpired() {
    return this.expiresAt !== null && Date.now() > this.expiresAt;
  }
}
