import type { PermissionFunctionOptional, PermissionFunctionRequired, PermissionsWithModels, User } from "@/types/index";

export const permission = {
    optional:
        <K extends keyof PermissionsWithModels>(
            fn: (ctx: {
                user: User;
                data?: PermissionsWithModels[K]["dataType"];
            }) => boolean,
        ): PermissionFunctionOptional<K> =>
            (ctx) =>
                fn({ user: ctx.user, ...(ctx.data !== undefined && { data: ctx.data }) }),

    required:
        <K extends keyof PermissionsWithModels>(
            fn: (ctx: {
                user: User;
                data?: PermissionsWithModels[K]["dataType"];
            }) => boolean,
        ): PermissionFunctionRequired<K> =>
            (ctx) => {
                if (!ctx.data) {
                    return false;
                }

                return fn({ user: ctx.user, data: ctx.data });
            },

    and: {
        check:
            <K extends keyof PermissionsWithModels>(
                ...checks: Array<
                    (ctx: {
                        user: User;
                        data?: PermissionsWithModels[K]["dataType"];
                    }) => boolean
                >
            ): PermissionFunctionOptional<K> =>
                (ctx) =>
                    checks.every((check) => check(ctx)),

        required:
            <K extends keyof PermissionsWithModels>(
                ...checks: Array<
                    (ctx: {
                        user: User;
                        data?: PermissionsWithModels[K]["dataType"];
                    }) => boolean
                >
            ): PermissionFunctionRequired<K> =>
                (ctx) => {
                    if (!ctx.data) {
                        return false;
                    }

                    return checks.every((check) =>
                        check({ user: ctx.user, data: ctx.data }),
                    );
                },
    },

    or: {
        check:
            <K extends keyof PermissionsWithModels>(
                ...checks: Array<
                    (ctx: {
                        user: User;
                        data?: PermissionsWithModels[K]["dataType"];
                    }) => boolean
                >
            ): PermissionFunctionOptional<K> =>
                (ctx) =>
                    checks.some((check) => check(ctx)),

        required:
            <K extends keyof PermissionsWithModels>(
                ...checks: Array<
                    (ctx: {
                        user: User;
                        data?: PermissionsWithModels[K]["dataType"];
                    }) => boolean
                >
            ): PermissionFunctionRequired<K> =>
                (ctx) => {
                    if (!ctx.data) {
                        return false;
                    }

                    return checks.some((check) =>
                        check({ user: ctx.user, data: ctx.data }),
                    );
                },
    },
};
