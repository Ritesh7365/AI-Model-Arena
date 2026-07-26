import type { NextConfig } from "next";
import path from "path";

const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  // Keep resolution inside the frontend package when a parent lockfile exists.
  outputFileTracingRoot: path.join(projectRoot),
  // Intentionally NO /api rewrite proxy.
  // Long-running Arena calls must go browser → Express (:3000) directly.
};

export default nextConfig;
