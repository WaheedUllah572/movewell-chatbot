import dns from "node:dns";
import nodemailer from "nodemailer";

const MAILTRAP_HOST = "sandbox.smtp.mailtrap.io";

const transporterPromise = dns.promises
  .resolve4(MAILTRAP_HOST)
  .then((addresses) => {
    const ipv4Address = addresses[0];

    if (!ipv4Address) {
      throw new Error("Could not resolve Mailtrap IPv4 address");
    }

    return nodemailer.createTransport({
      host: ipv4Address,
      port: 2525,
      secure: false,

      // Keep the original hostname for TLS certificate verification.
      tls: {
        servername: MAILTRAP_HOST,
      },

      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });
  });

type AppointmentReminderData = {
  patientName: string;
  patientEmail: string;
  doctorName: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
};

export async function sendAppointmentReminder(
  appointment: AppointmentReminderData
) {
  const transporter = await transporterPromise;

  const {
    patientName,
    patientEmail,
    doctorName,
    serviceName,
    date,
    startTime,
    endTime,
  } = appointment;

  await transporter.sendMail({
    from: {
      name: "MoveWell Physiotherapy",
      address:
        process.env.MAILTRAP_FROM_EMAIL || "wu0907020@gmail.com",
    },

    to: patientEmail,

    subject: "Reminder: Your MoveWell appointment is tomorrow",

    text: `
Hi ${patientName},

This is a reminder that you have an appointment with MoveWell Physiotherapy tomorrow.

Doctor: ${doctorName}
Service: ${serviceName}
Date: ${date}
Time: ${startTime} - ${endTime}

Please arrive on time for your appointment.

MoveWell Physiotherapy
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b;">
        <h2>Appointment Reminder</h2>

        <p>Hi ${patientName},</p>

        <p>
          This is a reminder that you have an appointment with
          <strong>MoveWell Physiotherapy</strong> tomorrow.
        </p>

        <p>
          <strong>Doctor:</strong> ${doctorName}<br />
          <strong>Service:</strong> ${serviceName}<br />
          <strong>Date:</strong> ${date}<br />
          <strong>Time:</strong> ${startTime} - ${endTime}
        </p>

        <p>Please arrive on time for your appointment.</p>

        <p>
          Regards,<br />
          <strong>MoveWell Physiotherapy</strong>
        </p>
      </div>
    `,
  });
}