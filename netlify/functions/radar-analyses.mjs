import { forwardError, requestScaneia } from "../../server/scaneia.js";

export default async (request) => {
  try {
    const url = new URL(request.url);
    const upstreamPath = `/api/internal/radar/analyses${url.search}`;
    return Response.json(await requestScaneia(upstreamPath));
  } catch (error) {
    const forwarded = forwardError(error);
    return Response.json(forwarded.body, { status: forwarded.status });
  }
};

export const config = { path: "/api/radar/analyses" };
