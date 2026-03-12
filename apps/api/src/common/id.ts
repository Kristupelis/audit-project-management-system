import { createId } from '@paralleldrive/cuid2';

export function projectId() {
  return `PID_${createId()}`;
}

export function userId() {
  return `UID_${createId()}`;
}

export function memberId() {
  return `MID_${createId()}`;
}

export function roleId() {
  return `RID_${createId()}`;
}

export function permissionId() {
  return `PER_${createId()}`;
}

export function auditId() {
  return `AUD_${createId()}`;
}
