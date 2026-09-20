import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedPatient } from "@/lib/auth/get-authenticated-patient";

export async function GET() {
  try {
    // Get the patient from the authenticated Supabase session.
    // We do NOT accept patient ID, email, or phone from the request.
    const patient = await getAuthenticatedPatient();

    if (!patient) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Fetch ONLY appointments belonging to the authenticated patient.
    const { data: appointments, error } = await supabaseAdmin
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

    if (error) {
      console.error("Failed to fetch appointments:", error);

      return NextResponse.json(
        {
          error: "Failed to fetch appointments",
        },
        { status: 500 }
      );
    }

    // Add doctor and service names.
    const results = await Promise.all(
      (appointments ?? []).map(async (appointment) => {
        const [{ data: doctor, error: doctorError }, { data: service, error: serviceError }] =
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

        if (doctorError) {
          console.warn(
            `Could not load doctor ${appointment.doctor_id}:`,
            doctorError.message
          );
        }

        if (serviceError) {
          console.warn(
            `Could not load service ${appointment.service_id}:`,
            serviceError.message
          );
        }

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

    return NextResponse.json({
      patient: {
        id: patient.id,
        name: patient.name,
      },
      appointments: results,
    });
  } catch (error) {
    console.error("Appointments API error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}