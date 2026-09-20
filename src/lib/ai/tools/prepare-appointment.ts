import { tool } from "ai";
import { z } from "zod";

export const prepareAppointmentRequest = tool({
  description:
    "Prepare a physiotherapy appointment request after all required patient information has been collected and the patient has confirmed the details.",

  inputSchema: z.object({
    reason: z
      .string()
      .min(1)
      .describe("Reason or physiotherapy service needed"),

    date: z
      .string()
      .min(1)
      .describe("Resolved appointment date"),

    time: z
      .string()
      .min(1)
      .describe("Preferred appointment time"),

    name: z
      .string()
      .min(1)
      .describe("Patient's full name"),

    phone: z
      .string()
      .min(1)
      .describe("Patient's phone number"),

    email: z.string().min(1).describe("Patient's email address"),
  }),

  execute: async ({
    reason,
    date,
    time,
    name,
    phone,
    email,
  }) => {
    return {
      status: "ready_for_submission" as const,
      demo: true,
      appointment: {
        reason,
        date,
        time,
        name,
        phone,
        email,
      },
      message:
        "The appointment request has been prepared. It has not been booked or submitted to clinic staff.",
    };
  },
});