import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const getAvailability = tool({
  description:
    "Check available appointment time slots for a specific doctor on a specific date. Use the doctor's name and never assume availability. If the patient requests a specific time, use requestedTime to verify that exact time.",

  inputSchema: z.object({
    doctorName: z
      .string()
      .min(1)
      .describe("The doctor's full name"),

    date: z
      .string()
      .describe("Appointment date in YYYY-MM-DD format"),

    requestedTime: z
      .string()
      .optional()
      .describe(
        "Optional requested appointment start time in HH:mm 24-hour format, for example 15:00 for 3 PM. Only provide this when the patient specifically requests a time."
      ),

    slotDurationMinutes: z
      .number()
      .int()
      .positive()
      .default(30)
      .describe("Appointment slot duration in minutes"),
  }),

  execute: async ({
    doctorName,
    date,
    requestedTime,
    slotDurationMinutes,
  }) => {
    // Find the doctor by name.
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
        doctorName,
        date,
        requestedTime: requestedTime ?? null,
        availableSlots: [],
        requestedSlot: null,
        requestedTimeAvailable: false,
        message: "The requested doctor could not be found.",
      };
    }

    if (doctors.length > 1) {
      return {
        status: "multiple_doctors_found" as const,
        doctorName,
        date,
        requestedTime: requestedTime ?? null,
        availableSlots: [],
        requestedSlot: null,
        requestedTimeAvailable: false,
        message:
          "Multiple doctors matched the provided name. Please specify the doctor more precisely.",
      };
    }

    const doctor = doctors[0];

    const { data, error } = await supabaseAdmin.rpc(
      "get_available_slots",
      {
        p_doctor_id: doctor.id,
        p_date: date,
        p_slot_duration_minutes: slotDurationMinutes,
      }
    );

    if (error) {
      throw new Error(
        `Failed to get availability: ${error.message}`
      );
    }

    const availableSlots = Array.isArray(data)
      ? data
      : [];

    /*
     * If the patient requested a specific time,
     * verify that exact time against the database result.
     *
     * The RPC may return the slot time using either:
     * - startTime
     * - start_time
     * - time
     *
     * We normalize those possible shapes before comparing.
     */
    let requestedSlot = null;
    let requestedTimeAvailable = false;

    if (requestedTime) {
      const normalizedRequestedTime =
        requestedTime.trim().slice(0, 5);

      requestedSlot =
        availableSlots.find((slot: unknown) => {
          if (!slot || typeof slot !== "object") {
            return false;
          }

          const slotRecord =
            slot as Record<string, unknown>;

          const rawTime =
            slotRecord.startTime ??
            slotRecord.start_time ??
            slotRecord.time;

          if (typeof rawTime !== "string") {
            return false;
          }

          return rawTime.slice(0, 5) ===
            normalizedRequestedTime;
        }) ?? null;

      requestedTimeAvailable =
        requestedSlot !== null;
    }

    return {
      status: "success" as const,
      doctorId: doctor.id,
      doctorName: doctor.name,
      date,
      slotDurationMinutes,
      requestedTime: requestedTime ?? null,
      requestedTimeAvailable,
      requestedSlot,
      availableSlots,
      message: requestedTime
        ? requestedTimeAvailable
          ? `The requested time ${requestedTime} is available.`
          : `The requested time ${requestedTime} is not available on this date.`
        : undefined,
    };
  },
});