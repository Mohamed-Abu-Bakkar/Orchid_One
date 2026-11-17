import { describe, expect, it } from "vitest";
import {
  canChangeAccountStatus,
  canChangePrimarySuperadmin,
  canManageAccountRole,
  hasRole,
  canDeletePayrollPeriod,
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


describe("role-based payroll deletion policy", () => {
  it("allows the primary Super Admin to delete draft, approved, and locked periods", () => {
    expect(canDeletePayrollPeriod("superadmin", true, "draft", ["draft"])).toBe(true);
    expect(canDeletePayrollPeriod("superadmin", true, "approved", ["approved"])).toBe(true);
    expect(canDeletePayrollPeriod("superadmin", true, "locked", ["locked"])).toBe(true);
  });

  it("denies payroll deletion to non-primary Super Admin accounts", () => {
    expect(canDeletePayrollPeriod("superadmin", false, "draft", ["draft"])).toBe(false);
    expect(canDeletePayrollPeriod("superadmin", false, "locked", ["locked"])).toBe(false);
  });

  it("allows Admins to delete only draft periods with draft records", () => {
    expect(canDeletePayrollPeriod("admin", false, "draft", ["draft", "draft"])).toBe(true);
    expect(canDeletePayrollPeriod("admin", false, "draft", [])).toBe(true);
  });

  it("prevents Admins from deleting approved or locked periods", () => {
    expect(canDeletePayrollPeriod("admin", false, "approved", ["approved"])).toBe(false);
    expect(canDeletePayrollPeriod("admin", false, "locked", ["locked"])).toBe(false);
  });

  it("prevents Admins from deleting a draft period containing advanced wage records", () => {
    expect(canDeletePayrollPeriod("admin", false, "draft", ["draft", "approved"])).toBe(false);
    expect(canDeletePayrollPeriod("admin", false, "draft", ["locked"])).toBe(false);
  });
});
