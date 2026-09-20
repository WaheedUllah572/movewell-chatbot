"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, ArrowLeft } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Appointment = {
  appointmentId: number;
  doctorName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string | null;
};

type AppointmentsResponse = {
  patient: {
    id: number;
    name: string;
  };
  appointments: Appointment[];
};

export default function AppointmentsPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientName, setPatientName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadAppointments = async () => {
      try {
        // Make sure the user is authenticated.
        const { data } = await supabaseBrowser.auth.getUser();

        if (!data.user) {
          router.replace("/login");
          return;
        }

        const response = await fetch("/api/appointments", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to load appointments.");
        }

        const result =
          (await response.json()) as AppointmentsResponse;

        if (!mounted) {
          return;
        }

        setPatientName(result.patient?.name ?? "");
        setAppointments(result.appointments ?? []);
      } catch (err) {
        console.error("Appointments page error:", err);

        if (mounted) {
          setError(
            "We couldn't load your appointments. Please try again."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadAppointments();

    return () => {
      mounted = false;
    };
  }, [router]);

  const formatDate = (date: string) => {
    const parsed = new Date(`${date}T00:00:00`);

    return parsed.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
      return time;
    }

    const period = hours >= 12 ? "PM" : "AM";
    const displayHour = hours % 12 || 12;

    return `${displayHour}:${String(minutes).padStart(
      2,
      "0"
    )} ${period}`;
  };

  const getStatusLabel = (status: string) => {
    return status
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-100";

      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-100";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-100";

      case "completed":
        return "bg-slate-100 text-slate-600 border-slate-200";

      default:
        return "bg-slate-50 text-slate-600 border-slate-200";
    }
  };

  if (loading) {
    return (
      <main className="min-h-[100dvh] bg-[#f7faf9] px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="mt-8 h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
          <div className="mt-4 h-40 animate-pulse rounded-2xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-[#f7faf9] text-slate-950">
      <header className="border-b border-slate-200/70 bg-white">
        <div className="mx-auto flex h-[74px] max-w-5xl items-center justify-between px-6">
          <div>
            <p className="text-[17px] font-extrabold tracking-tight">
              My Appointments
            </p>

            <p className="mt-0.5 text-[11px] text-slate-500">
              {patientName
                ? `Appointments for ${patientName}`
                : "Your appointments"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-[12px] font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <ArrowLeft className="size-4" />
            Back to assistant
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-8">
        {error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
            {error}
          </div>
        ) : appointments.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <CalendarDays className="mx-auto size-10 text-slate-300" />

            <h1 className="mt-4 text-lg font-bold">
              No appointments yet
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Your appointment requests will appear here.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-6 rounded-xl bg-[#08715d] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#075f50]"
            >
              Book an appointment
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Patient portal
              </p>

              <h1 className="mt-1 text-2xl font-extrabold tracking-tight">
                Your appointments
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                View your appointment requests and their current status.
              </p>
            </div>

            <div className="space-y-4">
              {appointments.map((appointment) => (
                <article
                  key={appointment.appointmentId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <CalendarDays className="size-5" />
                        </div>

                        <div>
                          <h2 className="text-[16px] font-bold">
                            {appointment.doctorName}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500">
                            {appointment.serviceName}
                          </p>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-[11px] font-semibold ${getStatusClasses(
                        appointment.status
                      )}`}
                    >
                      {getStatusLabel(appointment.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Date
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {formatDate(appointment.date)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Time
                      </p>

                      <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        <Clock className="size-3.5 text-slate-400" />
                        {formatTime(appointment.startTime)}
                        {" – "}
                        {formatTime(appointment.endTime)}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Appointment ID
                      </p>

                      <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
                        #{appointment.appointmentId}
                      </p>
                    </div>
                  </div>

                  {appointment.reason && (
                    <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        Reason
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.reason}
                      </p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}