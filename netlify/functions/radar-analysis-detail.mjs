import { forwardError, requestScaneia } from "../../server/scaneia.js";

export default async (request, context) => {
  try {
    const id = encodeURIComponent(context.params.id);
    const review = new URL(request.url).pathname.endsWith("/review");
    const path = `/api/internal/radar/analyses/${id}${review ? "/review" : ""}`;
    const options = request.method === "PUT" ? { method: "PUT", body: await request.text() } : {};
    return Response.json(await requestScaneia(path, options));
  } catch (error) {
    const forwarded = forwardError(error);
    return Response.json(forwarded.body, { status: forwarded.status });
  }
};

export const config = { path: ["/api/radar/analyses/:id", "/api/radar/analyses/:id/review"] };
