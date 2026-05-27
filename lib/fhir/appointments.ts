import { fhir } from './client';
import type { Appointment, Bundle, Patient } from './resources';
import { buildAppointment } from './builders';
import { clinicRoleFromAppointment, todayDateParam, type ClinicRole } from '../clinical/scheduling';
import {
  workflowFromAppointment,
  withWorkflow,
  type VisitWorkflow,
} from '../clinical/workflow';
import { fullName } from '@/lib/utils';
import { searchPatients } from './patient-search';

export type AppointmentRow = {
  appointment: Appointment;
  patientId?: string;
  patientName: string;
  clinicRole: ClinicRole | null;
  workflow: VisitWorkflow;
};

function splitAppointments(bundle: Bundle): Appointment[] {
  return (bundle.entry ?? [])
    .map(e => e.resource as Appointment | undefined)
    .filter((r): r is Appointment => r?.resourceType === 'Appointment');
}

function patientsFromBundle(bundle: Bundle): Map<string, Patient> {
  const map = new Map<string, Patient>();
  for (const entry of bundle.entry ?? []) {
    const r = entry.resource as { resourceType?: string; id?: string } | undefined;
    if (r?.resourceType === 'Patient' && r.id) map.set(r.id, r as Patient);
  }
  return map;
}

function patientIdFromAppointment(a: Appointment): string | undefined {
  const ref = a.participant?.find(p => p.actor?.reference?.startsWith('Patient/'))?.actor?.reference;
  return ref?.split('/').pop();
}

export function toAppointmentRow(a: Appointment, patients: Map<string, Patient>): AppointmentRow {
  const patientId = patientIdFromAppointment(a);
  const patient = patientId ? patients.get(patientId) : undefined;
  return {
    appointment: a,
    patientId,
    patientName: patient ? fullName(patient) : a.participant?.[0]?.actor?.display ?? 'Unknown patient',
    clinicRole: clinicRoleFromAppointment(a.appointmentType),
    workflow: workflowFromAppointment(a),
  };
}

export async function searchPatientsByName(query: string, count = 25): Promise<Patient[]> {
  return searchPatients(query, count);
}

export async function listAppointmentsForDay(
  date: string,
  clinicRole?: ClinicRole,
): Promise<AppointmentRow[]> {
  const params: Record<string, string | number> = {
    date,
    _count: 200,
    _include: 'Appointment:patient',
    _sort: 'date',
  };
  if (clinicRole) {
    params['appointment-type'] = clinicRole === 'nurse'
      ? 'http://glp1-monitor.local/CodeSystem/appointment-type|nurse-clinic'
      : 'http://glp1-monitor.local/CodeSystem/appointment-type|doctor-clinic';
  }

  try {
    const bundle = await fhir.search<Bundle>('Appointment', params);
    const patients = patientsFromBundle(bundle);
    return splitAppointments(bundle).map(a => toAppointmentRow(a, patients));
  } catch {
    const bundle = await fhir.search<Bundle>('Appointment', {
      date,
      _count: 200,
      _include: 'Appointment:patient',
    });
    const patients = patientsFromBundle(bundle);
    let rows = splitAppointments(bundle).map(a => toAppointmentRow(a, patients));
    if (clinicRole) rows = rows.filter(r => r.clinicRole === clinicRole);
    return rows;
  }
}

export async function createAppointment(args: {
  patientId: string;
  patientName?: string;
  clinicRole: ClinicRole;
  start: string;
  description?: string;
}): Promise<Appointment> {
  const resource = buildAppointment(args);
  return fhir.create<Appointment>('Appointment', resource);
}

export async function updateAppointmentStatus(
  appointmentId: string,
  status: Appointment['status'],
): Promise<Appointment> {
  const current = await fhir.read<Appointment>('Appointment', appointmentId);
  return fhir.update<Appointment>('Appointment', appointmentId, { ...current, status });
}

export async function updateVisitWorkflow(
  appointmentId: string,
  workflow: VisitWorkflow,
  status?: Appointment['status'],
): Promise<Appointment> {
  const current = await fhir.read<Appointment>('Appointment', appointmentId);
  let next = withWorkflow(current, workflow);
  if (status) next = { ...next, status };
  if (workflow === 'completed') next = { ...next, status: 'fulfilled' };
  return fhir.update<Appointment>('Appointment', appointmentId, next);
}

const NURSE_ACTIVE_WORKFLOWS: VisitWorkflow[] = ['waiting-nurse', 'nurse-in-progress', 'return-nurse'];
const DOCTOR_ACTIVE_WORKFLOWS: VisitWorkflow[] = ['ready-for-doctor', 'doctor-in-progress'];

/** Today's nurse visit for a patient still in the nursing stage (for completing documentation). */
export async function findActiveNurseAppointmentForPatient(
  patientId: string,
  date?: string,
): Promise<string | undefined> {
  const rows = await listAppointmentsForDay(date ?? todayDateParam());
  const match = rows.find(
    r => r.patientId === patientId && NURSE_ACTIVE_WORKFLOWS.includes(r.workflow),
  );
  return match?.appointment.id;
}

/** Today's doctor visit still in the consultation stage. */
export async function findActiveDoctorAppointmentForPatient(
  patientId: string,
  date?: string,
): Promise<string | undefined> {
  const rows = await listAppointmentsForDay(date ?? todayDateParam());
  const match = rows.find(
    r => r.patientId === patientId && DOCTOR_ACTIVE_WORKFLOWS.includes(r.workflow),
  );
  return match?.appointment.id;
}
