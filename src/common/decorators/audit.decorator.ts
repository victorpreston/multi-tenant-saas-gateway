import { SetMetadata, applyDecorators } from '@nestjs/common';
import {
  AUDIT_ACTION_KEY,
  AUDIT_RESOURCE_KEY,
} from '../../modules/audit/audit.interceptor';

export const Audit = (action: string, resource: string) =>
  applyDecorators(
    SetMetadata(AUDIT_ACTION_KEY, action),
    SetMetadata(AUDIT_RESOURCE_KEY, resource),
  );
