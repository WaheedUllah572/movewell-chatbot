import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function getAuthenticatedPatient() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return null;
  }

  const authUserId = data.claims.sub;

  const { data: patient, error: patientError } =
    await supabaseAdmin
      .from("patients")
      .select("id, clinic_id, name, phone, email, auth_user_id")
      .eq("auth_user_id", authUserId)
      .maybeSingle();

  if (patientError) {
    throw new Error(
      `Failed to find authenticated patient: ${patientError.message}`
    );
  }

  return patient;
}