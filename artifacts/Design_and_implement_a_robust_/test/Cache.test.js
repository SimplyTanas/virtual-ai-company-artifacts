// test/Cache.test.js
import { Cache } from '../src/index.js';

describe('Cache (LRU + TTL + events)', () => {
  let cache;
  beforeEach(() => {
    cache = new Cache({ maxSize: 3 });
  });

  test('basic set/get', async () => {
    await cache.set('a', 1);
    expect(await cache.get('a')).toBe(1);
    expect(await cache.size()).toBe(1);
  });

  test('LRU eviction', async () => {
    await cache.set('a', 1);
    await cache.set('b', 2);
    await cache.set('c', 3);
    // Access 'a' to make it most‑recent
    await cache.get('a');
    // Insert fourth entry -> should evict least‑recent ('b')
    await cache.set('d', 4);
    expect(await cache.get('b')).toBeUndefined();
    expect(await cache.get('c')).toBe(3);
    expect(await cache.get('a')).toBe(1);
    expect(await cache.get('d')).toBe(4);
  });

  test('TTL expiration', async () => {
    await cache.set('x', 'temp', 50); // 50 ms ttl
    expect(await cache.get('x')).toBe('temp');
    await new Promise(r => setTimeout(r, 60));
    expect(await cache.get('x')).toBeUndefined();
  });

  test('event emission', async () => {
    const hits = [];
    const misses = [];
    const evicts = [];

    cache.on('hit', p => hits.push(p));
    cache.on('miss', p => misses.push(p));
    cache.on('evict', p => evicts.push(p));

    await cache.set('k1', 'v1');
    await cache.set('k2', 'v2');
    await cache.set('k3', 'v3');
    await cache.get('k2'); // hit
    await cache.set('k4', 'v4'); // evicts k1 (LRU)

    expect(hits).toEqual([{ key: 'k2', value: 'v2' }]);
    expect(misses).toEqual([]);
    expect(evicts.map(e => e.key)).toContain('k1');
  });

  test('concurrent async sets are safe', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(cache.set(`c${i}`, i));
    }
    await Promise.all(promises);
    expect(await cache.size()).toBe(3); // maxSize = 3, only 3 most‑recent survive
  });
});
