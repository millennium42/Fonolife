export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "checked_in",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
] as const;

export const APPOINTMENT_BOOKING_MODES = ["normal", "fit_in", "walk_in"] as const;
export const APPOINTMENT_EVENT_TYPES = ["created", "confirmed", "rescheduled", "checked_in", "started", "completed", "cancelled", "note"] as const;

const isoDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function validDateTime(value: unknown) {
  return typeof value === "string" && isoDateTime.test(value) && !Number.isNaN(new Date(value).valueOf());
}

export function validAppointmentStatus(value: unknown): value is (typeof APPOINTMENT_STATUSES)[number] {
  return typeof value === "string" && APPOINTMENT_STATUSES.includes(value as never);
}

export function validBookingMode(value: unknown): value is (typeof APPOINTMENT_BOOKING_MODES)[number] {
  return typeof value === "string" && APPOINTMENT_BOOKING_MODES.includes(value as never);
}

export function validAppointmentWindow(start: unknown, end: unknown) {
  return validDateTime(start) && validDateTime(end) && new Date(String(end)).valueOf() > new Date(String(start)).valueOf();
}

const TRANSITIONS: Record<string, string[]> = {
  scheduled: ["confirmed", "checked_in", "in_progress", "cancelled", "no_show"],
  confirmed: ["checked_in", "in_progress", "cancelled", "no_show"],
  checked_in: ["in_progress", "completed", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionAppointment(from: string, to: string) {
  return validAppointmentStatus(from) && validAppointmentStatus(to) && TRANSITIONS[from].includes(to);
}
