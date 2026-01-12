/**
 * Type definitions for database entities
 * Ensures type-safe metadata and complex objects without using 'any'
 */

export interface TenantMetadata {
  industry?: string;
  country?: string;
  timezone?: string;
  customBranding?: {
    primaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
  };
  [key: string]: string | undefined | Record<string, unknown>;
}

export interface TenantSubscription {
  plan: 'free' | 'pro' | 'enterprise';
  maxUsers: number;
  maxApiKeys: number;
  features?: string[];
  billingCycle?: 'monthly' | 'annual';
  trialEndsAt?: Date;
}

export interface UserMetadata {
  lastIpAddress?: string;
  loginCount?: number;
  preferredLanguage?: string;
  theme?: 'light' | 'dark';
  timezone?: string;
  [key: string]: string | number | undefined | Date;
}

export interface AuditLogChanges {
  [fieldName: string]: {
    oldValue?: string | number | boolean | null;
    newValue?: string | number | boolean | null;
  };
}

export interface AuditLogMetadata {
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
  [key: string]: string | undefined;
}

export interface ApiKeyMetadata {
  lastUsedAt?: Date;
  usageCount?: number;
  allowedIps?: string[];
  rateLimit?: number;
  [key: string]: Date | number | string[] | undefined;
}

export interface RoleMetadata {
  description?: string;
  category?: string;
  isCustom?: boolean;
  [key: string]: string | boolean | undefined;
}
