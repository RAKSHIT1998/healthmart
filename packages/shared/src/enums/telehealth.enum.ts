export enum AppointmentType {
  VIDEO = 'video',
  AUDIO = 'audio',
}

export enum AppointmentStatus {
  PENDING_PAYMENT = 'pending_payment',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}
