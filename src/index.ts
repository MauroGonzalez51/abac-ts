import type { ActionRequirementsMap, PermissionContext, PermissionFunctionOptional, PermissionFunctionRequired, PermissionReturnType, PermissionsWithModels, PermissionsWithRoles, User } from "@/types/index";

export { permission } from "@/functions";
export type * from "@/types/index";

interface CreateEngineOptions<T extends PermissionsWithRoles> {
    roleHierarchy: Record<keyof T, Array<keyof T>>;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createEngine<const T extends PermissionsWithRoles>(rolesDefinition: T, options?: Partial<CreateEngineOptions<T>>) {
    type RequirementsMap = ActionRequirementsMap<T>;

    const ROLE_HIERARCHY = options?.roleHierarchy ?? Object.keys(rolesDefinition).reduce((acc, role) => {
        acc[role as keyof T] = [role as keyof T];
        return acc;
    }, {} as Record<keyof T, Array<keyof T>>);

    // eslint-disable-next-line ts/explicit-function-return-type
    function getPermission<Model extends keyof PermissionsWithModels, Action extends PermissionsWithModels[Model]["action"]>(args: {
        model: Model;
        action: Action;
        user: User;
    }) {
        const rolePermissions = rolesDefinition[args.user.role];
        if (!rolePermissions) {
            return;
        }

        if (typeof rolePermissions !== "object" || !(args.model in rolePermissions)) {
            return;
        }

        const modelPermissions =
            rolePermissions[args.model as keyof typeof rolePermissions];
        if (!modelPermissions || typeof modelPermissions !== "object") {
            return;
        }

        if (typeof modelPermissions !== "object" || !(args.action in modelPermissions)) {
            return;
        }

        const permission =
            modelPermissions[args.action as unknown as keyof typeof modelPermissions];

        return permission;
    }

    function explain<UserType extends User, RoleType extends UserType["role"], Model extends keyof PermissionsWithModels, Action extends PermissionsWithModels[Model]["action"]>(ctx: PermissionContext<RequirementsMap, UserType, RoleType, Model, Action>): PermissionReturnType {
        const rolesSet = ROLE_HIERARCHY[ctx.user.role as keyof T] ?? [ctx.user.role as keyof T];
        const inheritedRoles = [...new Set(rolesSet)] as Array<keyof T>;

        for (const role of inheritedRoles) {
            const permission = getPermission({ model: ctx.model, action: ctx.action, user: ctx.user });
            if (permission === undefined) {
                continue;
            }

            if (typeof permission === "boolean") {
                return {
                    allowed: permission,
                    matchedRole: role,
                    reason: "has-permission:matched-boolean",
                };
            }

            if (typeof permission === "function") {
                if (ctx.data === undefined) {
                    const allowed = (permission as PermissionFunctionOptional<Model>)({ user: ctx.user });

                    return {
                        allowed,
                        matchedRole: role,
                        reason: "has-permission:matched-function",
                    };
                }

                return {
                    allowed: (permission as PermissionFunctionRequired<Model>)(
                        {
                            user: ctx.user,
                            data: ctx.data,
                        },
                    ),
                    matchedRole: role,
                    reason: "has-permission:matched-function",
                };
            }
        }

        return {
            allowed: false,
            matchedRole: null,
            reason: "has-permission:no-matched-rule",
        };
    }

    function hasPermission<UserType extends User, RoleType extends UserType["role"], Model extends keyof PermissionsWithModels, Action extends PermissionsWithModels[Model]["action"]>(ctx: PermissionContext<RequirementsMap, UserType, RoleType, Model, Action>): boolean {
        return explain(ctx).allowed;
    }

    return { explain, hasPermission };
}
