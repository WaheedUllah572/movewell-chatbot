import "dotenv/config";

import { searchKnowledge } from "./search";

async function main() {
  const queries = [
    "What services do you offer?",
    "Can you help with back pain?",
    "Who specializes in sports rehabilitation?",
    "What are your opening hours?",
    "How can I request an appointment?",
  ];

  for (const query of queries) {
    console.log("\n========================================");
    console.log(`QUERY: ${query}`);
    console.log("========================================");

    const results = await searchKnowledge(query, 3, 0.30);

    if (results.length === 0) {
      console.log("No relevant documents found.");
      continue;
    }

    results.forEach((result, index) => {
      console.log(`\nResult ${index + 1}`);
      console.log(`Similarity: ${result.similarity.toFixed(4)}`);
      console.log(`Type: ${result.metadata.type}`);
      console.log(`Source: ${result.metadata.source}`);
      console.log(`Content:\n${result.content}`);
    });
  }
}

main().catch((error) => {
  console.error("\nSemantic search test failed:");
  console.error(error);
  process.exit(1);
});