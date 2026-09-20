import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { clinicKnowledge } from "./clinic";
import "dotenv/config";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type KnowledgeItem = {
  content: string;
  metadata: Record<string, string>;
};

function buildKnowledgeItems(): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];

  items.push({
    content: `
Clinic: ${clinicKnowledge.clinic.name}
Location: ${clinicKnowledge.clinic.location}
Phone: ${clinicKnowledge.clinic.phone}
Email: ${clinicKnowledge.clinic.email}

Opening hours:
Monday: ${clinicKnowledge.clinic.hours.monday}
Tuesday: ${clinicKnowledge.clinic.hours.tuesday}
Wednesday: ${clinicKnowledge.clinic.hours.wednesday}
Thursday: ${clinicKnowledge.clinic.hours.thursday}
Friday: ${clinicKnowledge.clinic.hours.friday}
Saturday: ${clinicKnowledge.clinic.hours.saturday}
Sunday: ${clinicKnowledge.clinic.hours.sunday}
`.trim(),
    metadata: {
      type: "clinic",
      source: "clinic-information",
    },
  });

  items.push({
  content: `
MoveWell Physiotherapy Clinic offers the following physiotherapy services:

1. General Physiotherapy — Assessment and rehabilitation support for common musculoskeletal problems.
2. Back & Neck Pain — Exercise-based rehabilitation and mobility support for back and neck problems.
3. Sports Rehabilitation — Recovery and return-to-sport support following sports-related injuries.
4. Post-Surgery Rehabilitation — Rehabilitation support following approved surgical procedures.
5. Therapeutic Exercise — Personalized movement and strengthening exercises based on individual needs.
6. Mobility & Injury Prevention — Movement-focused support designed to improve mobility and reduce injury risk.

Patients can ask the assistant for more information about any of these services.
`.trim(),
  metadata: {
    type: "clinic-overview",
    source: "clinic-services-overview",
  },
});

  for (const service of clinicKnowledge.services) {
    items.push({
      content: `
Service: ${service.name}
Description: ${service.description}
`.trim(),
      metadata: {
        type: "service",
        source: "clinic-services",
        name: service.name,
      },
    });
  }

  for (const therapist of clinicKnowledge.therapists) {
    items.push({
      content: `
Therapist: ${therapist.name}
Specialties: ${therapist.specialties.join(", ")}
Availability: ${therapist.availability}
`.trim(),
      metadata: {
        type: "therapist",
        source: "clinic-therapists",
        name: therapist.name,
      },
    });
  }

  items.push({
    content: `
Appointment process:
${clinicKnowledge.appointments.process
  .map((step, index) => `${index + 1}. ${step}`)
  .join("\n")}

Information collected:
${clinicKnowledge.appointments.requiredInformation
  .map((item) => `- ${item}`)
  .join("\n")}

Status:
${clinicKnowledge.appointments.status}
`.trim(),
    metadata: {
      type: "appointment",
      source: "appointment-process",
    },
  });

  items.push({
    content: `
Assistant role:
${clinicKnowledge.safety.role}

Safety limitations:
${clinicKnowledge.safety.limitations
  .map((item) => `- ${item}`)
  .join("\n")}
`.trim(),
    metadata: {
      type: "safety",
      source: "medical-safety",
    },
  });

  for (const item of clinicKnowledge.generalInformation) {
    items.push({
      content: `
Topic: ${item.topic}
Information: ${item.content}
`.trim(),
      metadata: {
        type: "general-information",
        source: "physiotherapy-information",
        topic: item.topic,
      },
    });
  }

  return items;
}

async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

async function main() {
  console.log("Starting MoveWell knowledge ingestion...");

  const knowledgeItems = buildKnowledgeItems();

  console.log(
    `Preparing ${knowledgeItems.length} knowledge records...`
  );

  const { error: deleteError } = await supabaseAdmin
    .from("documents")
    .delete()
    .neq("id", 0);

  if (deleteError) {
    throw deleteError;
  }

  for (const item of knowledgeItems) {
    console.log(`Embedding: ${item.metadata.source}`);

    const embedding = await generateEmbedding(item.content);

    const { error } = await supabaseAdmin.from("documents").insert({
      content: item.content,
      metadata: item.metadata,
      embedding,
    });

    if (error) {
      throw error;
    }
  }

  console.log(
    `Successfully inserted ${knowledgeItems.length} knowledge records.`
  );
}

main().catch((error) => {
  console.error("Knowledge ingestion failed:");
  console.error(error);
  process.exit(1);
});