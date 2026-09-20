import OpenAI from "openai";
import { supabaseAdmin } from "@/lib/supabase-admin";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type KnowledgeSearchResult = {
  id: number;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
};

export async function searchKnowledge(
  query: string,
  matchCount = 5,
  matchThreshold = 0.30
): Promise<KnowledgeSearchResult[]> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    return [];
  }

  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: cleanedQuery,
  });

  const queryEmbedding = embeddingResponse.data[0].embedding;

  const { data, error } = await supabaseAdmin.rpc(
    "match_documents",
    {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    }
  );

  if (error) {
    throw new Error(
      `Knowledge search failed: ${error.message}`
    );
  }

  return (data ?? []) as KnowledgeSearchResult[];
}