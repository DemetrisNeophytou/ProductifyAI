#!/usr/bin/env tsx
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { generateBlocksPDF } from "../server/blocks-pdf-export";

async function main() {
  const pdfBytes = await generateBlocksPDF({
    projectTitle: "ProductifyAI PDF Smoke Test",
    pages: [
      {
        id: "page-1",
        title: "Sample Page",
        blocks: [
          {
            id: "block-1",
            type: "paragraph",
            order: 1,
            content: {
              text: "This is a smoke test to validate that PDF generation works end-to-end."
            }
          },
          {
            id: "block-2",
            type: "cta",
            order: 2,
            content: {
              buttonText: "Let’s Go!"
            }
          }
        ]
      }
    ],
    brandKit: {
      primaryColor: "#5C3DF6"
    }
  });

  const outPath = join(tmpdir(), `productifyai-pdf-smoke-${Date.now()}.pdf`);
  await writeFile(outPath, pdfBytes);
  console.log(`✅ PDF smoke test complete: ${outPath}`);
}

main().catch((error) => {
  console.error("❌ PDF smoke test failed:", error);
  process.exit(1);
});




