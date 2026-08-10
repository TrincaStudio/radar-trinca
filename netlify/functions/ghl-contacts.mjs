import { forwardGhlError, listGhlContacts } from "../../server/highlevel.js";

export default async () => {
  try {
    return Response.json(await listGhlContacts());
  } catch (error) {
    const forwarded = forwardGhlError(error);
    return Response.json(forwarded.body, { status: forwarded.status });
  }
};

export const config = { path: "/api/ghl/contacts" };
