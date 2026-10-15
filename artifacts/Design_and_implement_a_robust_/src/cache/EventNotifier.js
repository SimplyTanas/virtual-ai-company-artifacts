// src/cache/EventNotifier.js
import { EventEmitter } from 'events';

/**
 * Typed wrapper around Node's EventEmitter.
 * Events:
 *   - hit   : { key, value }
 *   - miss  : { key }
 *   - set   : { key, value, ttl }
 *   - delete: { key, value }
 *   - evict : { key, value }
 *   - clear : {}
 */
export class EventNotifier extends EventEmitter {
  /**
   * Override emit to guarantee asynchronous delivery so cache core never blocks.
   * @param {string|symbol} event
   * @param {any} payload
   * @returns {boolean}
   */
  emit(event, payload) {
    // Use setImmediate to schedule emission after the current call stack.
    setImmediate(() => super.emit(event, payload));
    return true;
  }
}
