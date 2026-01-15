export enum TenantEvent {
  CREATED = 'tenant.created',
  UPDATED = 'tenant.updated',
  DELETED = 'tenant.deleted',
}

export enum UserEvent {
  CREATED = 'user.created',
  UPDATED = 'user.updated',
  DELETED = 'user.deleted',
}

// Tenant Events - Properly typed without conflicts
export interface TenantCreatedEvent {
  tenantId: string;
  name: string;
  slug: string;
  createdAt: Date;
}

export interface TenantUpdatedEvent {
  tenantId: string;
  name?: string;
  slug?: string;
  updatedAt: Date;
}

export interface TenantDeletedEvent {
  tenantId: string;
  deletedAt: Date;
}

// User Events - Properly typed without conflicts
export interface UserCreatedEvent {
  userId: string;
  email: string;
  name: string;
  tenantId: string;
  createdAt: Date;
}

export interface UserUpdatedEvent {
  userId: string;
  tenantId: string;
  updatedAt: Date;
}

export interface UserDeletedEvent {
  userId: string;
  tenantId: string;
  deletedAt: Date;
}

// Event Envelopes for proper typing
export interface TenantEventEnvelope<
  T extends TenantCreatedEvent | TenantUpdatedEvent | TenantDeletedEvent,
> {
  type: TenantEvent;
  payload: T;
  timestamp: Date;
}

export interface UserEventEnvelope<
  T extends UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent,
> {
  type: UserEvent;
  payload: T;
  timestamp: Date;
}
