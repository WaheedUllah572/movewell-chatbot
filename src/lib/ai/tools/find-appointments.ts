import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

export function createFindAppointmentsTool(
  authenticatedUserId: string
) {
  return tool({
    description:
      "Find the authenticated patient's appointments. The patient identity comes from the authenticated account. Never ask for or use email or phone number to identify the patient.",

    inputSchema: z.object({}),

    execute: async () => {
      // Find the patient using the authenticated Supabase user ID.
      const { data: patient, error: patientError } =
        await supabaseAdmin
          .from("patients")
          .select("id, name, email, phone")
          .eq("auth_user_id", authenticatedUserId)
          .maybeSingle();

      if (patientError) {
        throw new Error(
          `Failed to find authenticated patient: ${patientError.message}`
        );
      }

      if (!patient) {
        return {
          status: "not_found" as const,
          appointments: [],
          message:
            "No patient profile is linked to the authenticated account.",
        };
      }

      // Find ONLY this authenticated patient's appointments.
      const {
        data: appointments,
        error: appointmentError,
      } = await supabaseAdmin
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          reason,
          doctor_id,
          service_id
        `)
        .eq("patient_id", patient.id)
        .order("appointment_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (appointmentError) {
        throw new Error(
          `Failed to find appointments: ${appointmentError.message}`
        );
      }

      if (!appointments || appointments.length === 0) {
        return {
          status: "no_appointments" as const,
          appointments: [],
          message:
            "No appointments were found for this patient.",
        };
      }

      // Fetch doctor/service names.
      const results = await Promise.all(
        appointments.map(async (appointment) => {
          const [{ data: doctor }, { data: service }] =
            await Promise.all([
              supabaseAdmin
                .from("doctors")
                .select("name")
                .eq("id", appointment.doctor_id)
                .single(),

              supabaseAdmin
                .from("services")
                .select("name")
                .eq("id", appointment.service_id)
                .single(),
            ]);

          return {
            appointmentId: appointment.id,
            doctorName: doctor?.name ?? "Unknown",
            serviceName: service?.name ?? "Unknown",
            date: appointment.appointment_date,
            startTime: appointment.start_time,
            endTime: appointment.end_time,
            status: appointment.status,
            reason: appointment.reason,
          };
        })
      );

      return {
        status: "found" as const,
        patientName: patient.name,
        appointments: results,
        message: "Appointments found successfully.",
      };
    },
  });
}