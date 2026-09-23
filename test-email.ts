import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import { sendAppointmentReminder } from "./src/lib/email";

console.log("SMTP HOST:", process.env.MAILTRAP_SMTP_HOST);
console.log("SMTP PORT:", process.env.MAILTRAP_SMTP_PORT);
console.log("SMTP USER EXISTS:", !!process.env.MAILTRAP_SMTP_USER);
console.log("SMTP PASS EXISTS:", !!process.env.MAILTRAP_SMTP_PASS);

async function main() {
  await sendAppointmentReminder({
    patientName: "Test Patient",
    patientEmail: "test@example.com",
    doctorName: "Dr. Test Doctor",
    serviceName: "Physiotherapy",
    date: "2026-09-24",
    startTime: "10:00",
    endTime: "10:30",
  });

  console.log("TEST EMAIL SENT SUCCESSFULLY");
}

main().catch((error) => {
  console.error("TEST EMAIL FAILED:", error);
  process.exit(1);
});