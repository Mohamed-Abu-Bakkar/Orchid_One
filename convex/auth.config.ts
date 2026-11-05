const domain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!domain) throw new Error("CLERK_JWT_ISSUER_DOMAIN must be configured in the Convex deployment");
export default { providers: [{ domain, applicationID: "convex" }] };