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

export function auditAreaId() {
  return `AA_${createId()}`;
}

export function processId() {
  return `PROC_${createId()}`;
}

export function controlId() {
  return `CTRL_${createId()}`;
}

export function evidenceId() {
  return `EVID_${createId()}`;
}

export function evidenceFileId() {
  return `EVF_${createId()}`;
}

export function findingId() {
  return `FIND_${createId()}`;
}

export function testStepId() {
  return `TS_${createId()}`;
}
