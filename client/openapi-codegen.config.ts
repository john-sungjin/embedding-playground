import {
  generateSchemaTypes,
  generateReactQueryComponents,
} from "@openapi-codegen/typescript";
import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  server: {
    from: {
      relativePath: "../server/server_openapi.json",
      source: "file",
    },
    outputDir: "generated/server",
    to: async (context) => {
      const filenamePrefix = "server";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
