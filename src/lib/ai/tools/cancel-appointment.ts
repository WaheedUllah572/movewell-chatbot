import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

export function createCancelAppointmentTool(
  authenticatedUserId: string
) {
  return tool({
    description:
      "Cancel one of the authenticated patient's existing appointments. The patient's identity comes from the authenticated account. Never ask for or use email or phone number for identity verification.",

    inputSchema: z.object({
      appointmentId: z
        .number()
        .int()
        .positive()
        .describe("The appointment database ID to cancel"),
    }),

    execute: async ({ appointmentId }) => {
      // Find the authenticated patient's record.
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
          message:
            "No patient profile is linked to the authenticated account.",
        };
      }

      // Find the requested appointment.
      const { data: appointment, error: appointmentError } =
        await supabaseAdmin
          .from("appointments")
          .select(`
            id,
            appointment_date,
            start_time,
            end_time,
            status,
            doctor_id,
            service_id,
            patient_id
          `)
          .eq("id", appointmentId)
          .maybeSingle();

      if (appointmentError) {
        throw new Error(
          `Failed to find appointment: ${appointmentError.message}`
        );
      }

      if (!appointment) {
        return {
          status: "not_found" as const,
          message: "Appointment not found.",
        };
      }

      // CRITICAL SECURITY CHECK:
      // The appointment must belong to the authenticated patient.
      if (appointment.patient_id !== patient.id) {
        return {
          status: "not_found" as const,
          message: "Appointment not found.",
        };
      }

      // Prevent invalid cancellation states.
      if (appointment.status === "cancelled") {
        return {
          status: "already_cancelled" as const,
          message: "This appointment has already been cancelled.",
        };
      }

      if (appointment.status === "completed") {
        return {
          status: "cannot_cancel" as const,
          message: "A completed appointment cannot be cancelled.",
        };
      }

      // Get doctor information.
      const { data: doctor } = await supabaseAdmin
        .from("doctors")
        .select("name")
        .eq("id", appointment.doctor_id)
        .single();

      // Get service information.
      const { data: service } = await supabaseAdmin
        .from("services")
        .select("name")
        .eq("id", appointment.service_id)
        .single();

      // Cancel only the authenticated patient's appointment.
      const {
        data: updatedAppointment,
        error: updateError,
      } = await supabaseAdmin
        .from("appointments")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", appointmentId)
        .eq("patient_id", patient.id)
        .in("status", ["pending", "confirmed"])
        .select(
          "id, appointment_date, start_time, end_time, status"
        )
        .single();

      if (updateError || !updatedAppointment) {
        throw new Error(
          `Failed to cancel appointment: ${
            updateError?.message ??
            "Appointment could not be updated."
          }`
        );
      }

      return {
        status: "cancelled" as const,
        appointmentId: updatedAppointment.id,
        appointment: {
          patientName: patient.name,
          doctorName: doctor?.name ?? "Unknown",
          serviceName: service?.name ?? "Unknown",
          date: updatedAppointment.appointment_date,
          startTime: updatedAppointment.start_time,
          endTime: updatedAppointment.end_time,
          status: updatedAppointment.status,
        },
        message: "The appointment has been cancelled successfully.",
      };
    },
  });
}