import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  // Track all cache keys for clearing
  // Note: In single-instance deployments, this works well.
  // For distributed environments, consider using Redis SCAN or key patterns.
  private cacheKeys = new Set<string>();

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    this.cacheKeys.add(key);
    await this.cacheManager.set(key, value, ttl);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    this.cacheKeys.delete(key);
    await this.cacheManager.del(key);
  }

  /**
   * Delete multiple keys from cache
   */
  async delMultiple(keys: string[]): Promise<void> {
    keys.forEach((key) => this.cacheKeys.delete(key));
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * Clear all cache by deleting all tracked keys
   */
  async clear(): Promise<void> {
    const keysToDelete = Array.from(this.cacheKeys);
    this.cacheKeys.clear();
    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((key) => this.cacheManager.del(key)));
    }
  }

  /**
   * Get tenant cache key
   */
  getTenantKey(tenantId: string): string {
    return `tenant:${tenantId}`;
  }

  /**
   * Get tenant list cache key
   */
  getTenantListKey(): string {
    return 'tenants:list';
  }

  /**
   * Get user cache key
   */
  getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  /**
   * Get user list cache key for tenant
   */
  getUserListKey(tenantId: string): string {
    return `users:${tenantId}:list`;
  }

  /**
   * Invalidate tenant related caches
   */
  async invalidateTenant(tenantId: string): Promise<void> {
    await this.delMultiple([
      this.getTenantKey(tenantId),
      this.getTenantListKey(),
    ]);
  }

  /**
   * Invalidate user related caches
   */
  async invalidateUser(userId: string, tenantId: string): Promise<void> {
    await this.delMultiple([
      this.getUserKey(userId),
      this.getUserListKey(tenantId),
    ]);
  }
}
