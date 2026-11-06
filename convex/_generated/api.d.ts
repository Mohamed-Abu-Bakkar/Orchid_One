/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as account from "../account.js";
import type * as adminCrud from "../adminCrud.js";
import type * as adminOptions from "../adminOptions.js";
import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as betterAuth_auth from "../betterAuth/auth.js";
import type * as bootstrap from "../bootstrap.js";
import type * as companyDocuments from "../companyDocuments.js";
import type * as employee from "../employee.js";
import type * as employeeDocuments from "../employeeDocuments.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as locations from "../locations.js";
import type * as policies from "../policies.js";
import type * as teamsWork from "../teamsWork.js";
import type * as wages from "../wages.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  account: typeof account;
  adminCrud: typeof adminCrud;
  adminOptions: typeof adminOptions;
  attendance: typeof attendance;
  auth: typeof auth;
  "betterAuth/auth": typeof betterAuth_auth;
  bootstrap: typeof bootstrap;
  companyDocuments: typeof companyDocuments;
  employee: typeof employee;
  employeeDocuments: typeof employeeDocuments;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  locations: typeof locations;
  policies: typeof policies;
  teamsWork: typeof teamsWork;
  wages: typeof wages;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
