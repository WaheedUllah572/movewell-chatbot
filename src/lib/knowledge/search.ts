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

// Small in-memory cache for repeated questions.
// This helps during active sessions and local/deployment warm instances.
const embeddingCache = new Map<string, number[]>();

const MAX_CACHE_SIZE = 50;

function shouldUseKnowledgeSearch(query: string): boolean {
  const text = query.toLowerCase().trim();

  if (!text) return false;

  /*
   * These topics are already covered directly in the chatbot
   * system prompt and/or handled by appointment tools.
   * There is no reason to spend ~2+ seconds doing RAG for them.
   */

  const basicPatterns = [
    // Greetings / conversation
    /^(hi|hello|hey|thanks|thank you|good morning|good afternoon|good evening)[!. ]*$/i,

    // Clinic basics
    /\b(opening hours|opening time|closing time|working hours|business hours)\b/i,
    /\b(when are you open|when do you open|when do you close)\b/i,
    /\b(phone number|telephone number|contact number|email address|contact details)\b/i,

    // Doctors
    /\b(who are the doctors|which doctors|what doctors|doctor(s)? do you have)\b/i,

    // Services
    /\b(what services|services do you offer|what treatments|what do you offer)\b/i,

    // Basic location
    /\b(where are you located|where is the clinic|clinic location|clinic address)\b/i,
  ];

  return !basicPatterns.some((pattern) => pattern.test(text));
}

export function needsKnowledgeSearch(query: string): boolean {
  return shouldUseKnowledgeSearch(query);
}

export async function searchKnowledge(
  query: string,
  matchCount = 3,
  matchThreshold = 0.30
): Promise<KnowledgeSearchResult[]> {
  const cleanedQuery = query.trim();

  if (!cleanedQuery) {
    return [];
  }

  // Avoid RAG for information already available in the system prompt.
  if (!shouldUseKnowledgeSearch(cleanedQuery)) {
    console.log("[RAG] Skipped - basic clinic question");
    return [];
  }

  const cacheKey = cleanedQuery.toLowerCase();

  // Reuse an embedding if the same question is asked again.
  let queryEmbedding = embeddingCache.get(cacheKey);

  if (!queryEmbedding) {
    const embeddingStart = Date.now();

    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: cleanedQuery,
    });

    queryEmbedding = embeddingResponse.data[0].embedding;

    const embeddingTime = Date.now() - embeddingStart;

    console.log(`[RAG] Embedding time: ${embeddingTime} ms`);

    // Prevent unlimited cache growth.
    if (embeddingCache.size >= MAX_CACHE_SIZE) {
      const firstKey = embeddingCache.keys().next().value;

      if (firstKey) {
        embeddingCache.delete(firstKey);
      }
    }

    embeddingCache.set(cacheKey, queryEmbedding);
  } else {
    console.log("[RAG] Embedding cache hit");
  }

  const rpcStart = Date.now();

  const { data, error } = await supabaseAdmin.rpc(
    "match_documents",
    {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount,
    }
  );

  const rpcTime = Date.now() - rpcStart;

  console.log(`[RAG] Supabase vector search: ${rpcTime} ms`);

  if (error) {
    throw new Error(`Knowledge search failed: ${error.message}`);
  }

  return (data ?? []) as KnowledgeSearchResult[];
}