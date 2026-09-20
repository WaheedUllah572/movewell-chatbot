import { tool } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  clinicServices,
  clinicTherapists,
} from "@/lib/clinic/content";

type DoctorResult = {
  doctorId: number;
  doctorName: string;
  focus: string[];
  availability: string;
};

export const findDoctors = tool({
  description:
    "Find active physiotherapists based on a patient's service, reason, condition, treatment need, or preferred type of physiotherapy. Use this when the patient does not know the doctor's exact name.",

  inputSchema: z.object({
    reason: z
      .string()
      .optional()
      .describe(
        "The patient's reason, condition, treatment need, or preferred type of physiotherapy"
      ),

    serviceName: z
      .string()
      .optional()
      .describe(
        "The physiotherapy service the patient is interested in, if known"
      ),
  }),

  execute: async ({ reason, serviceName }) => {
    const { data: doctors, error } = await supabaseAdmin
      .from("doctors")
      .select("id, clinic_id, name")
      .eq("active", true)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to find doctors: ${error.message}`
      );
    }

    if (!doctors || doctors.length === 0) {
      return {
        status: "no_doctors_found" as const,
        doctors: [],
        message:
          "No active physiotherapists are currently available.",
      };
    }

    const searchText = [
      reason ?? "",
      serviceName ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .trim();

    /*
     * No specific search criteria:
     * return all active doctors.
     */
    if (!searchText) {
      const allDoctors: DoctorResult[] =
        doctors.map((doctor) => {
          const therapist =
            clinicTherapists.find(
              (item) =>
                item.name.toLowerCase() ===
                doctor.name.toLowerCase()
            );

          return {
            doctorId: doctor.id,
            doctorName: doctor.name,
            focus: therapist?.focus
              ? [...therapist.focus]
              : [],
            availability:
              therapist?.availability ?? "",
          };
        });

      return {
        status: "success" as const,
        search: {
          reason: "",
          serviceName: "",
        },
        doctors: allDoctors,
        message:
          "Active physiotherapists found.",
      };
    }

    /*
     * Match ONLY against the individual doctor's
     * own name, focus, and availability.
     *
     * Do not include all clinic services here because
     * that would incorrectly make every doctor match
     * every service.
     */
    const matchedDoctors = doctors
      .map((doctor): DoctorResult | null => {
        const therapist =
          clinicTherapists.find(
            (item) =>
              item.name.toLowerCase() ===
              doctor.name.toLowerCase()
          );

        const focus: string[] =
          therapist?.focus
            ? [...therapist.focus]
            : [];

        const availability =
          therapist?.availability ?? "";

        const doctorSearchText = [
          doctor.name,
          ...focus,
        ]
          .join(" ")
          .toLowerCase();

        /*
         * Check the service itself against this doctor's
         * own focus rather than against all clinic services.
         */
        let serviceMatches = false;

        if (serviceName) {
          const normalizedService =
            serviceName.toLowerCase().trim();

          const matchingService =
            clinicServices.find(
              (service) =>
                service.name
                  .toLowerCase()
                  .includes(normalizedService) ||
                normalizedService.includes(
                  service.name.toLowerCase()
                )
            );

          if (matchingService) {
            const serviceText = [
              matchingService.name,
              matchingService.description,
            ]
              .join(" ")
              .toLowerCase();

            const serviceKeywords =
              serviceText
                .split(/\s+/)
                .filter(
                  (keyword) =>
                    keyword.length >= 4
                );

            serviceMatches =
              serviceKeywords.some(
                (keyword) =>
                  doctorSearchText.includes(
                    keyword
                  )
              );
          }
        }

        /*
         * Match the patient's reason against the
         * individual doctor's focus.
         */
        let reasonMatches = false;

        if (reason) {
          const reasonKeywords =
            reason
              .toLowerCase()
              .split(/\s+/)
              .filter(
                (keyword) =>
                  keyword.length >= 4
              );

          reasonMatches =
            reasonKeywords.some(
              (keyword) =>
                doctorSearchText.includes(
                  keyword
                )
            );
        }

        if (!reasonMatches && !serviceMatches) {
          return null;
        }

        return {
          doctorId: doctor.id,
          doctorName: doctor.name,
          focus,
          availability,
        };
      })
      .filter(
        (
          doctor
        ): doctor is DoctorResult =>
          doctor !== null
      );

    return {
      status:
        matchedDoctors.length > 0
          ? ("success" as const)
          : ("no_matching_doctors" as const),

      search: {
        reason: reason ?? "",
        serviceName: serviceName ?? "",
      },

      doctors: matchedDoctors,

      message:
        matchedDoctors.length > 0
          ? "Matching physiotherapists found."
          : "No physiotherapist matching the requested treatment need was found.",
    };
  },
});