// src/cache/Cache.js
import { CacheCore } from './CacheCore.js';
import { EventNotifier } from './EventNotifier.js';
import { Mutex } from '../utils/Mutex.js';

/**
 * Public façade – all public methods are automatically guarded by a mutex,
 * guaranteeing that concurrent async calls cannot corrupt internal state.
 */
export class Cache {
  /**
   * @param {Object} options
   * @param {number} [options.maxSize=100] - maximum entries in the cache
   */
  constructor({ maxSize = 100 } = {}) {
    this._notifier = new EventNotifier();
    this._core = new CacheCore(maxSize, this._notifier);
    this._mutex = new Mutex();
  }

  /** Subscribe to cache events (hit, miss, set, delete, evict, clear) */
  on(event, listener) {
    this._notifier.on(event, listener);
    return this;
  }

  async set(key, value, ttlMs = null) {
    return this._mutex.runExclusive(() => this._core.set(key, value, ttlMs));
  }

  async get(key) {
    return this._mutex.runExclusive(() => this._core.get(key));
  }

  async delete(key) {
    return this._mutex.runExclusive(() => this._core.delete(key));
  }

  async clear() {
    return this._mutex.runExclusive(() => this._core.clear());
  }

  async size() {
    return this._mutex.runExclusive(() => this._core.size());
  }
}
