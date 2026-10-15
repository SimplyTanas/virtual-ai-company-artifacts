// src/utils/Mutex.js
import { Mutex as AsyncMutex } from 'async-mutex';

/**
 * Simple wrapper around async-mutex to expose a `runExclusive` method
 * that returns the result of the supplied async function.
 */
export class Mutex {
  constructor() {
    this._mutex = new AsyncMutex();
  }

  /**
   * Executes the supplied function while holding the lock.
   * @param {Function} fn - async function to run inside the lock
   * @returns {Promise<*>} result of fn
   */
  async runExclusive(fn) {
    const release = await this._mutex.acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }
}
