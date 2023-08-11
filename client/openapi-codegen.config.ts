import {
  generateSchemaTypes,
  generateFetchers,
} from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  server: {
    from: {
      relativePath: "../server/server_openapi.json",
      source: "file",
    },
    outputDir: "app/generated/server",
    to: async (context) => {
      const filenamePrefix = "server";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateFetchers(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
