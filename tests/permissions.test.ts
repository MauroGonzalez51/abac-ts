import type { PermissionsWithRoles } from "@@/src/index";
import { createEngine, permission } from "@@/src/index";
import { describe, expect, it } from "vitest";

declare module "@/types/index" {
    interface UserRoleMap {
        admin: "admin";
        user: "user";
    }

    interface Models {
        Post: {
            id: string;
            authorId: string;
        };
    }

    interface User {
        role: "admin" | "user";
        id: string;
    }
}

function ROLES() {
    return {
        admin: {
            Post: {
                view: true,
                delete: permission.required(({ user, data }) => user.id === data?.authorId),
            },
        },
        user: {},
    } as const satisfies PermissionsWithRoles;
}

function engine() {
    return createEngine(ROLES());
}

describe("basic permissions", () => {
    it("should allow a simple permission", () => {
        expect(engine().hasPermission({ model: "Post", action: "view", user: { id: "1", role: "admin" } })).toBe(true);
    });

    it("should deny when the permission is not defined", () => {
        expect(engine().hasPermission({ model: "Post", action: "update", user: { id: "1", role: "admin" } })).toBe(false);
    });
});

describe("role without permissions", () => {
    it("should deny when role has no permissions defined", () => {
        const result = engine().explain({
            model: "Post",
            action: "view",
            user: { id: "2", role: "user" },
        });
        expect(result.allowed).toBe(false);
        expect(result.matchedRole).toBe(null);
    });

    it("should return correct reason when no permission is found", () => {
        const result = engine().explain({
            model: "Post",
            action: "create",
            user: { id: "1", role: "admin" },
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe("has-permission:no-matched-rule");
    });

    it("should return correct reason for boolean permission", () => {
        const result = engine().explain({
            model: "Post",
            action: "view",
            user: { id: "1", role: "admin" },
        });
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe("has-permission:matched-boolean");
        expect(result.matchedRole).toBe("admin");
    });

    it("should return correct reason for function permission", () => {
        const result = engine().explain({
            model: "Post",
            action: "delete",
            user: { id: "1", role: "admin" },
            data: { id: "1", authorId: "1" },
        });
        expect(result.allowed).toBe(true);
        expect(result.reason).toBe("has-permission:matched-function");
        expect(result.matchedRole).toBe("admin");
    });
});

describe("permission helpers", () => {
    function ROLES_WITH_HELPERS() {
        return {
            admin: {
                Post: {
                    view: true,
                    create: permission.and.check(
                        ({ user }) => user.id !== "",
                        ({ user }) => user.role === "admin",
                    ),
                    update: permission.or.check(
                        ({ user, data }) => data?.authorId === user.id,
                        ({ user }) => user.role === "admin",
                    ),
                    delete: permission.required(({ user }) => user.id === "1"),
                },
            },
            user: {},
        } as const satisfies PermissionsWithRoles;
    }

    it("should allow when all AND conditions are met", () => {
        const engine = createEngine(ROLES_WITH_HELPERS());

        const result = engine.explain({
            model: "Post",
            action: "create",
            user: { id: "1", role: "admin" },
        });
        expect(result.allowed).toBe(true);
    });

    it("should deny when any AND condition fails", () => {
        const engine = createEngine(ROLES_WITH_HELPERS());
        const result = engine.explain({
            model: "Post",
            action: "create",
            user: { id: "", role: "admin" },
        });
        expect(result.allowed).toBe(false);
    });

    it("should allow when at least one OR condition is met", () => {
        const engine = createEngine(ROLES_WITH_HELPERS());
        const result = engine.explain({
            model: "Post",
            action: "update",
            user: { id: "1", role: "admin" },
            data: { id: "1", authorId: "2" },
        });
        expect(result.allowed).toBe(true);
    });

    it("should deny when no OR conditions are met", () => {
        const ROLES_USER_OR = {
            admin: {},
            user: {
                Post: {
                    update: permission.or.check(
                        ({ user, data }) => data?.authorId === user.id,
                        ({ user }) => user.role === "admin",
                    ),
                },
            },
        } as const satisfies PermissionsWithRoles;

        const engine = createEngine(ROLES_USER_OR);
        const result = engine.explain({
            model: "Post",
            action: "update",
            user: { id: "1", role: "user" },
            data: { id: "1", authorId: "2" },
        });
        expect(result.allowed).toBe(false);
    });
});
