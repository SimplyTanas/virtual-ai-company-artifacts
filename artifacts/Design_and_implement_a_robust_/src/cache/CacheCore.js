// src/cache/CacheCore.js
import { LRUList, LRUNode } from './LRUList.js';
import { CacheEntry } from './CacheEntry.js';
import { EventNotifier } from './EventNotifier.js';

export class CacheCore {
  /**
   * @param {number} maxSize - maximum number of entries allowed in the cache
   * @param {EventNotifier} notifier - shared event emitter
   */
  constructor(maxSize, notifier) {
    if (!Number.isInteger(maxSize) || maxSize <= 0) {
      throw new Error('maxSize must be a positive integer');
    }
    this.maxSize = maxSize;
    this.notifier = notifier;

    /** @type {Map<any, CacheEntry>} */
    this.map = new Map(); // key -> CacheEntry
    this.lru = new LRUList();
  }

  /** @private Evict least‑recent entries until size constraint satisfied */
  _evictIfNeeded() {
    while (this.map.size > this.maxSize) {
      const lruNode = this.lru.removeTail();
      if (!lruNode) break; // Defensive – should never happen
      const entry = this.map.get(lruNode.key);
      this.map.delete(lruNode.key);
      this.notifier.emit('evict', { key: lruNode.key, value: entry?.value });
    }
  }

  /** @private Remove entry if expired; returns true when it was purged */
  _purgeExpired(entry, key) {
    if (entry.isExpired()) {
      this.map.delete(key);
      this.lru.remove(entry.node);
      this.notifier.emit('evict', { key, value: entry.value });
      return true;
    }
    return false;
  }

  /**
   * Store a value under `key`.
   * @param {*} key
   * @param {*} value
   * @param {number|null} ttlMs - optional TTL in milliseconds
   */
  set(key, value, ttlMs = null) {
    if (this.map.has(key)) {
      // Update existing entry
      const existing = this.map.get(key);
      existing.value = value;
      existing.expiresAt = ttlMs != null ? Date.now() + ttlMs : null;
      this.lru.moveToFront(existing.node);
    } else {
      const node = new LRUNode(key);
      const entry = new CacheEntry(value, ttlMs, node);
      this.map.set(key, entry);
      this.lru.addFront(node);
    }
    this.notifier.emit('set', { key, value, ttl: ttlMs });
    this._evictIfNeeded();
  }

  /**
   * Retrieve a value. Returns `undefined` on miss or if the entry has expired.
   * @param {*} key
   * @returns {*|undefined}
   */
  get(key) {
    const entry = this.map.get(key);
    if (!entry) {
      this.notifier.emit('miss', { key });
      return undefined;
    }
    if (this._purgeExpired(entry, key)) {
      this.notifier.emit('miss', { key });
      return undefined;
    }
    // Cache hit – move to front
    this.lru.moveToFront(entry.node);
    this.notifier.emit('hit', { key, value: entry.value });
    return entry.value;
  }

  /**
   * Explicitly delete a key.
   * @param {*} key
   * @returns {boolean} true if the key existed and was removed
   */
  delete(key) {
    const entry = this.map.get(key);
    if (!entry) return false;
    this.map.delete(key);
    this.lru.remove(entry.node);
    this.notifier.emit('delete', { key, value: entry.value });
    return true;
  }

  /** Remove all entries from the cache. */
  clear() {
    this.map.clear();
    this.lru = new LRUList();
    this.notifier.emit('clear', {});
  }

  /**
   * Return the current number of stored entries (excluding any that have expired).
   * @returns {number}
   */
  size() {
    // Lazy purge of expired entries to keep the reported size accurate.
    for (const [k, e] of this.map.entries()) {
      this._purgeExpired(e, k);
    }
    return this.map.size;
  }
}
