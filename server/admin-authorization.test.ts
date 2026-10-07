import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { isAuthorizedAdminEmail } from "../shared/const";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(email: string | null): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email,
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("authorized admin access", () => {
  it("accepts the configured admin addresses case-insensitively", () => {
    expect(isAuthorizedAdminEmail("mhamadhiwa2009x@gmail.com")).toBe(true);
    expect(isAuthorizedAdminEmail("  AJSNU32@GMAIL.COM ")).toBe(true);
    expect(isAuthorizedAdminEmail("kanko2862@gmail.com")).toBe(true);
  });

  it("rejects missing and unknown addresses", () => {
    expect(isAuthorizedAdminEmail(null)).toBe(false);
    expect(isAuthorizedAdminEmail(undefined)).toBe(false);
    expect(isAuthorizedAdminEmail("customer@example.com")).toBe(false);
  });

  it("rejects a non-admin product mutation before database access", async () => {
    const caller = appRouter.createCaller(createContext("customer@example.com"));

    await expect(
      caller.admin.products.create({
        name: "Unauthorized product",
        brand: "Unauthorized brand",
        description: undefined,
        price: "100",
        imageUrl: undefined,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a non-admin category mutation before database access", async () => {
    const caller = appRouter.createCaller(createContext("customer@example.com"));

    await expect(
      caller.admin.categories.create({
        name: "BMW",
        iconUrl: null,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
