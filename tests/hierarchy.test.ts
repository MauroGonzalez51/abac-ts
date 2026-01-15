import type { PermissionsWithRoles } from "@@/src/index";
import { createEngine } from "@@/src/index";
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
        admin: {},
        user: {
            Post: {
                view: true,
                create: true,
                delete: false,
                update: true,
            },
        },
    } as const satisfies PermissionsWithRoles;
}

function engine() {
    return createEngine(ROLES(), {
        roleHierarchy: {
            admin: ["admin", "user"],
            user: ["user"],
        },
    });
}

describe("hierarchy", () => {
    it("should allow an inherited permission", () => {
        expect(
            engine().hasPermission({
                model: "Post",
                action: "view",
                user: { id: "1", role: "admin" },
            }),
        ).toBe(true);
    });
});
