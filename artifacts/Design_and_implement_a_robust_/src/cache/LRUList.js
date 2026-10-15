// src/cache/LRUList.js

/**
 * Doubly‑linked list node used by LRUList.
 * @property {any} key
 * @property {LRUNode|null} prev
 * @property {LRUNode|null} next
 */
export class LRUNode {
  constructor(key) {
    this.key = key;
    this.prev = null;
    this.next = null;
  }
}

/**
 * O(1) LRU list. Head = most‑recent, Tail = least‑recent.
 */
export class LRUList {
  constructor() {
    this.head = null;
    this.tail = null;
  }

  /** Move an existing node to the front (most‑recent) */
  moveToFront(node) {
    if (node === this.head) return;
    this._remove(node);
    this._addFront(node);
  }

  /** Add a brand‑new node to the front */
  addFront(node) {
    this._addFront(node);
  }

  /** Remove the tail node and return it (or null) */
  removeTail() {
    if (!this.tail) return null;
    const oldTail = this.tail;
    this._remove(oldTail);
    return oldTail;
  }

  /** Remove a node from wherever it lives */
  remove(node) {
    this._remove(node);
  }

  /** Internal: unlink node from list */
  _remove(node) {
    if (node.prev) node.prev.next = node.next;
    if (node.next) node.next.prev = node.prev;
    if (node === this.head) this.head = node.next;
    if (node === this.tail) this.tail = node.prev;
    node.prev = null;
    node.next = null;
  }

  /** Internal: prepend node */
  _addFront(node) {
    node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }
}
