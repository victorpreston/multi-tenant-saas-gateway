import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import {
  TenantEvent,
  TenantCreatedEvent,
  TenantUpdatedEvent,
  TenantDeletedEvent,
  TenantEventEnvelope,
  UserEvent,
  UserCreatedEvent,
  UserUpdatedEvent,
  UserDeletedEvent,
  UserEventEnvelope,
} from '../events/events';

@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  constructor(
    @Inject('KAFKA_CLIENT')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Subscribe to all topics that might be needed
    this.kafkaClient.subscribeToResponseOf('tenant.events');
    this.kafkaClient.subscribeToResponseOf('user.events');
    await this.kafkaClient.connect();
  }

  publishTenantCreated(payload: TenantCreatedEvent): void {
    this.publishToTenant(TenantEvent.CREATED, payload);
  }

  publishTenantUpdated(payload: TenantUpdatedEvent): void {
    this.publishToTenant(TenantEvent.UPDATED, payload);
  }

  publishTenantDeleted(payload: TenantDeletedEvent): void {
    this.publishToTenant(TenantEvent.DELETED, payload);
  }

  publishUserCreated(payload: UserCreatedEvent): void {
    this.publishToUser(UserEvent.CREATED, payload);
  }

  publishUserUpdated(payload: UserUpdatedEvent): void {
    this.publishToUser(UserEvent.UPDATED, payload);
  }

  publishUserDeleted(payload: UserDeletedEvent): void {
    this.publishToUser(UserEvent.DELETED, payload);
  }

  private publishToTenant(
    eventType: TenantEvent,
    payload: TenantCreatedEvent | TenantUpdatedEvent | TenantDeletedEvent,
  ): void {
    try {
      const envelope: TenantEventEnvelope<
        TenantCreatedEvent | TenantUpdatedEvent | TenantDeletedEvent
      > = {
        type: eventType,
        payload,
        timestamp: new Date(),
      };
      this.kafkaClient.emit('tenant.events', envelope);
      this.logger.debug(`Published tenant event: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish tenant event: ${eventType}`, error);
      throw error;
    }
  }

  private publishToUser(
    eventType: UserEvent,
    payload: UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent,
  ): void {
    try {
      const envelope: UserEventEnvelope<
        UserCreatedEvent | UserUpdatedEvent | UserDeletedEvent
      > = {
        type: eventType,
        payload,
        timestamp: new Date(),
      };
      this.kafkaClient.emit('user.events', envelope);
      this.logger.debug(`Published user event: ${eventType}`);
    } catch (error) {
      this.logger.error(`Failed to publish user event: ${eventType}`, error);
      throw error;
    }
  }
}
