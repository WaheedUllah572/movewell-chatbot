import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

export function createAppointmentTool(patientId: number) {
  return tool({
    description:
      "Create an appointment for the currently authenticated patient after the patient has reviewed and explicitly confirmed all appointment details. The patient identity is determined by the authenticated session, not by email or phone supplied by the AI.",

    inputSchema: z.object({
      doctorName: z
        .string()
        .min(1)
        .describe("The doctor's full name"),

      serviceName: z
        .string()
        .min(1)
        .describe("The clinic service name"),

      date: z
        .string()
        .describe("Appointment date in YYYY-MM-DD format"),

      startTime: z
        .string()
        .describe("Appointment start time in HH:MM format"),

      durationMinutes: z
        .number()
        .int()
        .positive()
        .default(30)
        .describe("Appointment duration in minutes"),

      reason: z
        .string()
        .min(1)
        .describe("Reason for the appointment"),
    }),

    execute: async ({
      doctorName,
      serviceName,
      date,
      startTime,
      durationMinutes,
      reason,
    }) => {
      // Verify that the authenticated patient still exists.
      const { data: patient, error: patientError } =
        await supabaseAdmin
          .from("patients")
          .select("id, clinic_id, name, phone, email")
          .eq("id", patientId)
          .maybeSingle();

      if (patientError) {
        throw new Error(
          `Failed to verify authenticated patient: ${patientError.message}`
        );
      }

      if (!patient) {
        return {
          status: "patient_not_found" as const,
          message:
            "Your patient account could not be verified. Please sign in again.",
        };
      }

      // Find doctor by name.
      const { data: doctors, error: doctorError } =
        await supabaseAdmin
          .from("doctors")
          .select("id, clinic_id, name")
          .eq("active", true)
          .ilike("name", doctorName.trim());

      if (doctorError) {
        throw new Error(
          `Failed to find doctor: ${doctorError.message}`
        );
      }

      if (!doctors || doctors.length === 0) {
        return {
          status: "doctor_not_found" as const,
          message: "The selected doctor could not be found.",
        };
      }

      if (doctors.length > 1) {
        return {
          status: "multiple_doctors_found" as const,
          message:
            "Multiple doctors matched the selected name. Please specify the doctor more precisely.",
        };
      }

      const doctor = doctors[0];

      // Make sure the doctor belongs to the patient's clinic.
      if (doctor.clinic_id !== patient.clinic_id) {
        return {
          status: "invalid_clinic" as const,
          message:
            "The selected doctor is not available at your clinic.",
        };
      }

      // Find service within the doctor's clinic.
      const { data: services, error: serviceError } =
        await supabaseAdmin
          .from("services")
          .select("id, clinic_id, name")
          .eq("clinic_id", doctor.clinic_id)
          .eq("active", true)
          .ilike("name", serviceName.trim());

      if (serviceError) {
        throw new Error(
          `Failed to find service: ${serviceError.message}`
        );
      }

      if (!services || services.length === 0) {
        return {
          status: "service_not_found" as const,
          message: "The selected service could not be found.",
        };
      }

      if (services.length > 1) {
        return {
          status: "multiple_services_found" as const,
          message:
            "Multiple services matched the selected name. Please specify the service more precisely.",
        };
      }

      const service = services[0];

      // Validate start time.
      const [hours, minutes] = startTime.split(":").map(Number);

      if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        throw new Error("Invalid appointment start time.");
      }

      const startTotalMinutes = hours * 60 + minutes;
      const endTotalMinutes =
        startTotalMinutes + durationMinutes;

      if (endTotalMinutes > 24 * 60) {
        throw new Error("Appointment duration exceeds the day.");
      }

      const endHours = Math.floor(endTotalMinutes / 60);
      const endMinutes = endTotalMinutes % 60;

      const normalizedStartTime =
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;

      const endTime =
        `${String(endHours).padStart(2, "0")}:${String(endMinutes).padStart(2, "0")}:00`;

      // Re-check availability immediately before creation.
      const {
        data: availableSlots,
        error: availabilityError,
      } = await supabaseAdmin.rpc("get_available_slots", {
        p_doctor_id: doctor.id,
        p_date: date,
        p_slot_duration_minutes: durationMinutes,
      });

      if (availabilityError) {
        throw new Error(
          `Failed to verify availability: ${availabilityError.message}`
        );
      }

      const slotIsAvailable = (
        availableSlots ?? []
      ).some(
        (slot: {
          slot_start: string;
          slot_end: string;
        }) => slot.slot_start === normalizedStartTime
      );

      if (!slotIsAvailable) {
        return {
          status: "unavailable" as const,
          message:
            "That appointment time is no longer available. Please choose another available time.",
        };
      }

      // IMPORTANT:
      // The appointment is ALWAYS created for the authenticated
      // patientId. No email/phone lookup is used here.
      const {
        data: appointment,
        error: appointmentError,
      } = await supabaseAdmin
        .from("appointments")
        .insert({
          clinic_id: doctor.clinic_id,
          patient_id: patient.id,
          doctor_id: doctor.id,
          service_id: service.id,
          appointment_date: date,
          start_time: normalizedStartTime,
          end_time: endTime,
          status: "pending",
          reason,
        })
        .select(
          "id, appointment_date, start_time, end_time, status"
        )
        .single();

      if (appointmentError || !appointment) {
        if (appointmentError?.code === "23505") {
          return {
            status: "unavailable" as const,
            message:
              "That appointment time was just taken. Please choose another available time.",
          };
        }

        throw new Error(
          `Failed to create appointment: ${
            appointmentError?.message ?? "Unknown error"
          }`
        );
      }

      return {
        status: "created" as const,
        appointmentId: appointment.id,
        appointment: {
          patientName: patient.name,
          doctorName: doctor.name,
          serviceName: service.name,
          date: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
          status: appointment.status,
        },
        message:
          "The appointment has been created successfully with pending status.",
      };
    },
  });
}