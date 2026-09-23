import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { sendAppointmentReminder } from "@/lib/email";

export const dynamic = "force-dynamic";

const CLINIC_TIMEZONE = "Europe/Paris";

function getClinicDateTime() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CLINIC_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function localDateTimeToComparableMs(
  date: string,
  time: string
) {
  const [year, month, day] = date.split("-").map(Number);

  const [hour, minute, second = 0] = time
    .split(":")
    .map(Number);

  return Date.UTC(
    year,
    month - 1,
    day,
    hour,
    minute,
    second
  );
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (
      process.env.CRON_SECRET &&
      authHeader !== `Bearer ${process.env.CRON_SECRET}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    /*
     * Get the current time in the clinic's timezone.
     */
    const clinicNow = getClinicDateTime();

    const currentComparableMs = Date.UTC(
      clinicNow.year,
      clinicNow.month - 1,
      clinicNow.day,
      clinicNow.hour,
      clinicNow.minute,
      clinicNow.second
    );

    /*
     * We only need appointments around 24 hours away.
     *
     * Query today and tomorrow because the appointment
     * date is stored separately from the appointment time.
     */
    const currentDate = `${clinicNow.year}-${String(
      clinicNow.month
    ).padStart(2, "0")}-${String(clinicNow.day).padStart(
      2,
      "0"
    )}`;

    const tomorrowComparable = new Date(
      Date.UTC(
        clinicNow.year,
        clinicNow.month - 1,
        clinicNow.day + 1
      )
    );

    const tomorrowDate = `${tomorrowComparable.getUTCFullYear()}-${String(
      tomorrowComparable.getUTCMonth() + 1
    ).padStart(2, "0")}-${String(
      tomorrowComparable.getUTCDate()
    ).padStart(2, "0")}`;

    const { data: appointments, error: appointmentsError } =
      await supabaseAdmin
        .from("appointments")
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          patient_id,
          doctor_id,
          service_id
        `)
        .eq("status", "pending")
        .gte("appointment_date", currentDate)
        .lte("appointment_date", tomorrowDate);

    if (appointmentsError) {
      throw appointmentsError;
    }

    if (!appointments || appointments.length === 0) {
      return NextResponse.json({
        success: true,
        checked: 0,
        sent: 0,
        skipped: 0,
        failed: 0,
        message: "No appointments need reminders.",
      });
    }

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const appointment of appointments) {
      try {
        /*
         * Convert the appointment's clinic-local date/time
         * into a comparable timestamp.
         */
        const appointmentComparableMs =
          localDateTimeToComparableMs(
            appointment.appointment_date,
            appointment.start_time
          );

        const hoursUntilAppointment =
          (appointmentComparableMs - currentComparableMs) /
          (1000 * 60 * 60);

        /*
         * Only send reminders between 23 and 25 hours
         * before the appointment.
         */
        if (
          hoursUntilAppointment < 23 ||
          hoursUntilAppointment > 25
        ) {
          skipped++;
          continue;
        }

        /*
         * Prevent duplicate 24-hour reminders.
         */
        const { data: existingReminder, error: reminderError } =
          await supabaseAdmin
            .from("appointment_reminders")
            .select("id")
            .eq("appointment_id", appointment.id)
            .eq("reminder_type", "24_hour")
            .maybeSingle();

        if (reminderError) {
          throw reminderError;
        }

        if (existingReminder) {
          skipped++;
          continue;
        }

        /*
         * Get patient.
         */
        const { data: patient, error: patientError } =
          await supabaseAdmin
            .from("patients")
            .select("id, name, email")
            .eq("id", appointment.patient_id)
            .maybeSingle();

        if (patientError) {
          throw patientError;
        }

        if (!patient?.email) {
          console.warn(
            `Appointment ${appointment.id} has no patient email.`
          );

          skipped++;
          continue;
        }

        /*
         * Get doctor.
         */
        const { data: doctor, error: doctorError } =
          await supabaseAdmin
            .from("doctors")
            .select("id, name")
            .eq("id", appointment.doctor_id)
            .maybeSingle();

        if (doctorError) {
          throw doctorError;
        }

        /*
         * Get service.
         */
        const { data: service, error: serviceError } =
          await supabaseAdmin
            .from("services")
            .select("id, name")
            .eq("id", appointment.service_id)
            .maybeSingle();

        if (serviceError) {
          throw serviceError;
        }

        /*
         * Send reminder email.
         */
        await sendAppointmentReminder({
          patientName: patient.name,
          patientEmail: patient.email,
          doctorName:
            doctor?.name || "Your physiotherapist",
          serviceName:
            service?.name || "Physiotherapy",
          date: appointment.appointment_date,
          startTime: appointment.start_time,
          endTime: appointment.end_time,
        });

        /*
         * Record successful reminder.
         */
        const { error: insertReminderError } =
          await supabaseAdmin
            .from("appointment_reminders")
            .insert({
              appointment_id: appointment.id,
              reminder_type: "24_hour",
              sent_at: new Date().toISOString(),
            });

        if (insertReminderError) {
          throw insertReminderError;
        }

        sent++;

        console.log(
          `24-hour reminder sent for appointment ${appointment.id}`
        );
      } catch (error) {
        console.error(
          `Failed reminder for appointment ${appointment.id}:`,
          error
        );

        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      checked: appointments.length,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error(
      "Appointment reminder cron error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to process appointment reminders.",
      },
      { status: 500 }
    );
  }
}