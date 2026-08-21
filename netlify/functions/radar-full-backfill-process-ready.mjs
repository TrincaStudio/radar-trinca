import { forwardError, requestScaneia } from "../../server/scaneia.js";

export default async (request) => {
  try {
    const url = new URL(request.url);
    const upstreamPath = `/api/internal/radar/full-backfill/process-ready${url.search}`;
    return Response.json(await requestScaneia(upstreamPath, { method: "POST" }));
  } catch (error) {
    const forwarded = forwardError(error);
    return Response.json(forwarded.body, { status: forwarded.status });
  }
};

export const config = { path: "/api/radar/full-backfill/process-ready" };
