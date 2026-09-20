import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clinicTherapists } from "@/lib/clinic/content";

export const findDoctorsWithAvailability = tool({
  description:
    "Find only doctors who are clinically relevant to the patient's treatment need and have availability on the requested date. Use when the patient does not know a doctor's name but provides a condition, treatment need, service, or reason plus a date. Never return unrelated doctors.",

  inputSchema: z.object({
    reason: z
      .string()
      .min(1)
      .describe(
        "Patient's condition, treatment need, service, or reason, such as back pain, neck pain, sports injury, sports rehabilitation, or injury prevention."
      ),

    serviceName: z
      .string()
      .optional()
      .describe("Optional requested physiotherapy service."),

    date: z
      .string()
      .regex(
        /^\d{4}-\d{2}-\d{2}$/,
        "Date must be in YYYY-MM-DD format."
      )
      .describe("Appointment date in YYYY-MM-DD format."),

    slotDurationMinutes: z
      .number()
      .int()
      .positive()
      .default(30)
      .describe("Appointment slot duration in minutes."),
  }),

  execute: async ({
    reason,
    serviceName,
    date,
    slotDurationMinutes,
  }) => {
    const text = `${reason} ${serviceName ?? ""}`
      .trim()
      .toLowerCase();

    /*
     * =========================================================
     * 1. EXPLICIT CLINICAL MAPPING
     * =========================================================
     *
     * Do not use broad word matching against therapist profiles.
     *
     * Sophie:
     * - Musculoskeletal physiotherapy
     * - Back and neck rehabilitation
     *
     * Thomas:
     * - Sports rehabilitation
     * - Injury prevention
     */

    const matchesSophie =
      text.includes("back pain") ||
      text.includes("lower back") ||
      text.includes("low back") ||
      text.includes("back") ||
      text.includes("neck pain") ||
      text.includes("neck") ||
      text.includes("cervical") ||
      text.includes("lumbar") ||
      text.includes("musculoskeletal") ||
      text.includes("back & neck") ||
      text.includes("back and neck");

    const matchesThomas =
      text.includes("sports rehabilitation") ||
      text.includes("sports rehab") ||
      text.includes("sports injury") ||
      text.includes("sport injury") ||
      text.includes("sports") ||
      text.includes("athletic") ||
      text.includes("return to sport") ||
      text.includes("injury prevention");

    /*
     * "injury" by itself is intentionally NOT treated as enough
     * to select Thomas. It is too ambiguous.
     */

    const matchingNames = new Set<string>();

    if (matchesSophie) {
      matchingNames.add("Dr. Sophie Martin");
    }

    if (matchesThomas) {
      matchingNames.add("Thomas Bernard");
    }

    /*
     * =========================================================
     * 2. SERVICE-BASED MATCHING
     * =========================================================
     */

    const normalizedService =
      serviceName?.trim().toLowerCase() ?? "";

    if (
      normalizedService === "back & neck pain" ||
      normalizedService === "back and neck pain"
    ) {
      matchingNames.add("Dr. Sophie Martin");
    }

    if (
      normalizedService === "sports rehabilitation"
    ) {
      matchingNames.add("Thomas Bernard");
    }

    if (
      normalizedService ===
      "mobility & injury prevention" ||
      normalizedService ===
      "mobility and injury prevention"
    ) {
      matchingNames.add("Thomas Bernard");
    }

    /*
     * =========================================================
     * 3. BUILD CLINICALLY RELEVANT CANDIDATES
     * =========================================================
     */

    const candidates = clinicTherapists.filter(
      (therapist) =>
        matchingNames.has(therapist.name)
    );

    /*
     * =========================================================
     * 4. NO RELEVANT DOCTOR
     * =========================================================
     */

    if (candidates.length === 0) {
      return {
        status: "no_relevant_doctors" as const,
        reason,
        serviceName: serviceName ?? null,
        date,
        slotDurationMinutes,
        doctors: [],
        message:
          "No specific doctor in the clinic data is mapped to this treatment need.",
      };
    }

    /*
     * =========================================================
     * 5. CHECK DATABASE + AVAILABILITY
     * =========================================================
     */

    const doctorResults = await Promise.all(
      candidates.map(async (therapist) => {
        const { data: doctors, error: doctorError } =
          await supabaseAdmin
            .from("doctors")
            .select("id, clinic_id, name")
            .eq("active", true)
            .ilike("name", therapist.name.trim());

        if (doctorError) {
          throw new Error(
            `Failed to find doctor ${therapist.name}: ${doctorError.message}`
          );
        }

        if (!doctors || doctors.length === 0) {
          return null;
        }

        const doctor = doctors[0];

        const { data: slots, error: availabilityError } =
          await supabaseAdmin.rpc(
            "get_available_slots",
            {
              p_doctor_id: doctor.id,
              p_date: date,
              p_slot_duration_minutes:
                slotDurationMinutes,
            }
          );

        if (availabilityError) {
          throw new Error(
            `Failed to get availability for ${doctor.name}: ${availabilityError.message}`
          );
        }

        return {
          doctorId: doctor.id,
          doctorName: doctor.name,
          focus: therapist.focus,
          availability: therapist.availability,
          date,
          availableSlots: slots ?? [],
        };
      })
    );

    const doctors = doctorResults.filter(
      (
        doctor
      ): doctor is NonNullable<typeof doctor> =>
        doctor !== null
    );

    /*
     * =========================================================
     * 6. ONLY RETURN DOCTORS WITH ACTUAL AVAILABILITY
     * =========================================================
     */

    const availableDoctors = doctors.filter(
      (doctor) =>
        doctor.availableSlots.length > 0
    );

    if (availableDoctors.length === 0) {
      return {
        status: "no_availability" as const,
        reason,
        serviceName: serviceName ?? null,
        date,
        slotDurationMinutes,
        doctors: doctors.map((doctor) => ({
          doctorId: doctor.doctorId,
          doctorName: doctor.doctorName,
          focus: doctor.focus,
          availability: doctor.availability,
          date: doctor.date,
          availableSlots: [],
        })),
        message:
          "Relevant doctors were found, but none have available appointment slots on the requested date.",
      };
    }

    /*
     * =========================================================
     * 7. SUCCESS
     * =========================================================
     */

    return {
      status: "success" as const,
      reason,
      serviceName: serviceName ?? null,
      date,
      slotDurationMinutes,
      doctors: availableDoctors,
      message:
        "Only clinically relevant doctors with actual availability were returned.",
    };
  },
});