'use server';

import { revalidatePath } from 'next/cache';
import {
  createAppointment,
  findActiveDoctorAppointmentForPatient,
  findActiveNurseAppointmentForPatient,
  listAppointmentsForDay,
  updateAppointmentStatus,
  updateVisitWorkflow,
} from '@/lib/fhir/appointments';
import { canViewClinicalData } from '@/lib/clinic/access';
import { getActingRoleFromCookie } from '@/lib/clinic/server-role';
import { todayDateParam, type ClinicRole } from '@/lib/clinical/scheduling';
import { acknowledgeReturningSymptomReport } from '@/lib/kiosk/symptom-report-store';
import type { VisitWorkflow } from '@/lib/clinical/workflow';
import type { Appointment } from '@/lib/fhir/resources';

function revalidateScheduling() {
  revalidatePath('/reception');
  revalidatePath('/clinic/nurse');
  revalidatePath('/clinic/doctor');
}

function assertReceptionOrAdmin(): void {
  const role = getActingRoleFromCookie();
  if (role !== 'reception' && role !== 'admin') {
    throw new Error('Only reception staff can perform this action.');
  }
}

export async function bookAppointment(args: {
  patientId: string;
  patientName?: string;
  clinicRole: ClinicRole;
  start: string;
  description?: string;
  symptomReportId?: string;
}): Promise<Appointment> {
  assertReceptionOrAdmin();
  const created = await createAppointment(args);
  if (args.symptomReportId?.trim()) {
    await acknowledgeReturningSymptomReport(args.symptomReportId.trim());
  }
  revalidateScheduling();
  revalidatePath('/kiosk');
  return created;
}

/** Kiosk symptom alert — doctor follow-up on today's doctor queue (no clinical chart access). */
export async function scheduleKioskSymptomDoctorFollowUp(args: {
  reportId: string;
  patientId: string;
  patientName: string;
}): Promise<Appointment> {
  assertReceptionOrAdmin();

  const reportId = args.reportId.trim();
  const patientId = args.patientId.trim();
  if (!reportId || !patientId) {
    throw new Error('Missing symptom alert or patient.');
  }

  const existingDoctorQueueId = await findActiveDoctorAppointmentForPatient(patientId);
  if (existingDoctorQueueId) {
    await acknowledgeReturningSymptomReport(reportId);
    revalidateScheduling();
    revalidatePath('/kiosk');
    const rows = await listAppointmentsForDay(todayDateParam());
    const row = rows.find(r => r.appointment.id === existingDoctorQueueId);
    if (row?.appointment) return row.appointment;
    throw new Error('Patient is already on the doctor queue today.');
  }

  const rows = await listAppointmentsForDay(todayDateParam());
  const scheduledDoctor = rows.find(
    r =>
      r.patientId === patientId
      && r.clinicRole === 'doctor'
      && r.workflow === 'scheduled'
      && r.appointment.status !== 'noshow'
      && r.appointment.status !== 'fulfilled',
  );

  let appointment: Appointment;
  if (scheduledDoctor?.appointment.id) {
    appointment = await advanceVisitWorkflow(
      scheduledDoctor.appointment.id,
      'ready-for-doctor',
      'arrived',
    );
  } else {
    appointment = await createAppointment({
      patientId,
      patientName: args.patientName,
      clinicRole: 'doctor',
      start: new Date().toISOString(),
      description: 'Kiosk symptom check — doctor follow-up',
      workflow: 'ready-for-doctor',
      status: 'arrived',
    });
  }

  await acknowledgeReturningSymptomReport(reportId);
  revalidateScheduling();
  revalidatePath('/kiosk');
  return appointment;
}

export async function setAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
): Promise<Appointment> {
  const updated = await updateAppointmentStatus(appointmentId, status);
  revalidateScheduling();
  return updated;
}

export async function advanceVisitWorkflow(
  appointmentId: string,
  workflow: VisitWorkflow,
  status?: Appointment['status'],
): Promise<Appointment> {
  const updated = await updateVisitWorkflow(appointmentId, workflow, status);
  revalidateScheduling();
  return updated;
}

/** Reception check-in: patient arrived and enters nurse queue. */
export async function checkInPatient(appointmentId: string): Promise<Appointment> {
  return advanceVisitWorkflow(appointmentId, 'waiting-nurse', 'arrived');
}

/** Nurse finished documentation — patient appears in the doctor queue. */
export async function completeNurseVisit(args: {
  patientId: string;
  appointmentId?: string;
}): Promise<Appointment> {
  if (!canViewClinicalData(getActingRoleFromCookie())) {
    throw new Error('You do not have permission to complete nurse documentation.');
  }

  let appointmentId = args.appointmentId?.trim();
  if (!appointmentId) {
    appointmentId = await findActiveNurseAppointmentForPatient(args.patientId);
  }
  if (!appointmentId) {
    throw new Error(
      'No active nurse visit found for today. Open documentation from the nurse queue using Start.',
    );
  }

  return advanceVisitWorkflow(appointmentId, 'ready-for-doctor');
}

function assertDoctorRole(): void {
  const role = getActingRoleFromCookie();
  if (role !== 'doctor' && role !== 'admin') {
    throw new Error('Only a doctor can complete or route a consultation.');
  }
}

/** Doctor finished consult — patient leaves doctor queue and appears at reception for checkout. */
export async function sendPatientToReceptionCheckout(args: {
  patientId: string;
  appointmentId?: string;
}): Promise<Appointment> {
  assertDoctorRole();

  let appointmentId = args.appointmentId?.trim();
  if (!appointmentId) {
    appointmentId = await findActiveDoctorAppointmentForPatient(args.patientId);
  }
  if (!appointmentId) {
    throw new Error(
      'No active consultation found for today. Open the visit from the doctor queue using Start.',
    );
  }

  return advanceVisitWorkflow(appointmentId, 'ready-checkout');
}

/** Return to nursing without closing the consultation (draft may be resumed later). */
export async function sendPatientBackToNurse(args: {
  patientId: string;
  appointmentId?: string;
}): Promise<Appointment> {
  assertDoctorRole();

  let appointmentId = args.appointmentId?.trim();
  if (!appointmentId) {
    appointmentId = await findActiveDoctorAppointmentForPatient(args.patientId);
  }
  if (!appointmentId) {
    throw new Error(
      'No active consultation found for today. Open the visit from the doctor queue using Start.',
    );
  }

  return advanceVisitWorkflow(appointmentId, 'return-nurse');
}
