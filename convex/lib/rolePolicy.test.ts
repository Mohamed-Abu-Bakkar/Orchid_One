import { describe, expect, it } from "vitest";
import {
  canChangeAccountStatus,
  canChangePrimarySuperadmin,
  canManageAccountRole,
  hasRole,
  canDeleteDraftPayroll,
} from "./rolePolicy";

describe("platform and organization role boundaries", () => {
  it("does not implicitly grant superadmin permissions to admins", () => {
    expect(hasRole("admin", ["superadmin"])).toBe(false);
    expect(hasRole("superadmin", ["superadmin"])).toBe(true);
  });

  it("allows admins to manage only employee and supervisor roles", () => {
    expect(canManageAccountRole("admin", "employee", "supervisor")).toBe(true);
    expect(canManageAccountRole("admin", "supervisor", "employee")).toBe(true);
    expect(canManageAccountRole("admin", "admin", "employee")).toBe(false);
    expect(canManageAccountRole("admin", "employee", "superadmin")).toBe(false);
  });

  it("allows only superadmins to manage administrator roles", () => {
    expect(canManageAccountRole("superadmin", "admin", "superadmin")).toBe(true);
    expect(canManageAccountRole("superadmin", "superadmin", "admin")).toBe(true);
    expect(canManageAccountRole("supervisor", "employee", "supervisor")).toBe(false);
    expect(canManageAccountRole("employee", "employee", "supervisor")).toBe(false);
  });

  it("limits admin account lifecycle changes to employees and supervisors", () => {
    expect(canChangeAccountStatus("admin", "employee")).toBe(true);
    expect(canChangeAccountStatus("admin", "supervisor")).toBe(true);
    expect(canChangeAccountStatus("admin", "admin")).toBe(false);
    expect(canChangeAccountStatus("admin", "superadmin")).toBe(false);
    expect(canChangeAccountStatus("superadmin", "admin")).toBe(true);
  });

  it("protects the primary Super Admin from downgrade or suspension", () => {
    expect(canChangePrimarySuperadmin(true, "admin")).toBe(false);
    expect(canChangePrimarySuperadmin(true, "superadmin", "suspended")).toBe(false);
    expect(canChangePrimarySuperadmin(true, "superadmin", "active")).toBe(true);
    expect(canChangePrimarySuperadmin(false, "admin")).toBe(true);
  });
});


describe("primary Super Admin payroll deletion policy", () => {
  it("allows the primary operator to delete a draft period with only draft records", () => {
    expect(canDeleteDraftPayroll(true, "draft", ["draft", "draft"])).toBe(true);
    expect(canDeleteDraftPayroll(true, "draft", [])).toBe(true);
  });

  it("denies payroll deletion to non-primary accounts", () => {
    expect(canDeleteDraftPayroll(false, "draft", ["draft"])).toBe(false);
  });

  it("protects pending, approved, and locked payroll periods", () => {
    expect(canDeleteDraftPayroll(true, "pending_approval", ["draft"])).toBe(false);
    expect(canDeleteDraftPayroll(true, "approved", ["draft"])).toBe(false);
    expect(canDeleteDraftPayroll(true, "locked", ["draft"])).toBe(false);
  });

  it("protects a draft period if any wage record has advanced beyond draft", () => {
    expect(canDeleteDraftPayroll(true, "draft", ["draft", "pending_approval"])).toBe(false);
    expect(canDeleteDraftPayroll(true, "draft", ["draft", "approved"])).toBe(false);
    expect(canDeleteDraftPayroll(true, "draft", ["locked"])).toBe(false);
  });
});
