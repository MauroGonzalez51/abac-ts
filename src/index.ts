import type {
    PermissionContext,
    PermissionFunction,
    PermissionReturnType,
    PermissionsWithModels,
    PermissionsWithRoles,
    User,
    UserRole,
} from "@/types/index";

export { permission } from "@/functions";
export type * from "@/types/index";

interface CreateEngineOptions<T extends PermissionsWithRoles> {
    roleHierarchy: Record<keyof T, Array<keyof T>>;
}

// eslint-disable-next-line ts/explicit-function-return-type
export function createEngine<const T extends PermissionsWithRoles>(
    rolesDefinition: T,
    options?: Partial<CreateEngineOptions<T>>,
) {
    // eslint-disable-next-line ts/explicit-function-return-type
    function getPermission<
        Model extends keyof PermissionsWithModels,
        Action extends PermissionsWithModels[Model]["action"],
    >(args: { model: Model; action: Action; user: User }) {
        const rolePermissions = rolesDefinition[args.user.role];
        if (!rolePermissions) {
            return;
        }

        if (
            typeof rolePermissions !== "object" ||
            !(args.model in rolePermissions)
        ) {
            return;
        }

        const modelPermissions =
            rolePermissions[args.model as keyof typeof rolePermissions];
        if (!modelPermissions || typeof modelPermissions !== "object") {
            return;
        }

        if (
            typeof modelPermissions !== "object" ||
            !(args.action in modelPermissions)
        ) {
            return;
        }

        const permission =
            modelPermissions[
                args.action as unknown as keyof typeof modelPermissions
            ];

        return permission;
    }

    function explain<
        Model extends keyof PermissionsWithModels,
        Action extends PermissionsWithModels[Model]["action"],
    >(ctx: PermissionContext<Model, Action>): PermissionReturnType {
        const userRole = ctx.user.role as keyof T;
        const rolesSet = options?.roleHierarchy?.[userRole] ?? [userRole];
        const inheritedRoles = [...new Set(rolesSet)] as Array<keyof T>;
        
        for (const role of inheritedRoles) {
            const permission = getPermission({
                model: ctx.model,
                action: ctx.action,
                user: { ...ctx.user, role: role as UserRole },
            });
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
                return {
                    allowed: (permission as PermissionFunction<Model>)({
                        user: { ...ctx.user, role: role as UserRole },
                        ...(ctx.data !== undefined && { data: ctx.data }),
                    }),
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

    function hasPermission<
        Model extends keyof PermissionsWithModels,
        Action extends PermissionsWithModels[Model]["action"],
    >(ctx: PermissionContext<Model, Action>): boolean {
        return explain(ctx).allowed;
    }

    return { explain, hasPermission };
}
