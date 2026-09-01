import { defineConfig } from "orval";

const openApiOrigin = process.env.OPENAPI_ORIGIN ?? "http://localhost:8080";

const createProject = (group: "public" | "member" | "admin") => ({
  input: {
    target: `${openApiOrigin}/v3/api-docs/${group}`,
  },
  output: {
    target: `src/generated/api/${group}/index.ts`,
    schemas: `src/generated/api/${group}/models`,
    client: "react-query" as const,
    httpClient: "fetch" as const,
    mode: "split" as const,
    clean: true,
    formatter: "prettier" as const,
    override: {
      fetch: {
        includeHttpResponseReturnType: false,
      },
      mutator: {
        path: "./src/shared/api/orval-mutator.ts",
        name: "orvalFetch",
      },
    },
  },
});

export default defineConfig({
  public: createProject("public"),
  member: createProject("member"),
  admin: createProject("admin"),
});
