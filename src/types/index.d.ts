/* eslint-disable style/indent */

export interface UserRoleMap { }

export type UserRole = keyof UserRoleMap;

export interface User {
    role: UserRole;
}

export type Action = "view" | "create" | "delete" | "update";

export type PermissionFunctionRequired<
    K extends keyof PermissionsWithModels,
> = (ctx: {
    user: User;
    data: PermissionsWithModels[K]["dataType"];
}) => boolean;

export type PermissionFunctionOptional<
    K extends keyof PermissionsWithModels,
> = (ctx: {
    user: User;
    data?: PermissionsWithModels[K]["dataType"];
}) => boolean;

export type CheckPermission<K extends keyof PermissionsWithModels> =
    | boolean
    | PermissionFunctionRequired<K>
    | PermissionFunctionOptional<K>;

export interface Models {
}

export type MakePermissionsWithModels<T> = {
    [K in keyof T]: {
        dataType: T[K];
        action: Action;
    };
};

export type PermissionsWithModels =
    MakePermissionsWithModels<Models>;

export type PermissionSet<K extends keyof PermissionsWithModels> = {
    [A in Action]?: CheckPermission<K>;
};

export type PermissionsWithRoles = {
    [R in UserRole]: {
        [K in keyof PermissionsWithModels]?: PermissionSet<K>;
    };
};

export type ActionRequirementsMap<T extends PermissionsWithRoles> = {
    [R in keyof T]: {
        [M in keyof T[R]]: {
            [A in keyof T[R][M]]: T[R][M][A] extends PermissionFunctionRequired<
                infer K
            >
            ? PermissionsWithModels[K]["dataType"]
            : undefined;
        };
    };
};

export type GetDataType<
    RequirementsMap,
    Role extends UserRole,
    Model extends keyof PermissionsWithModels,
    Action extends PermissionsWithModels[Model]["action"],
> = Role extends keyof RequirementsMap
    ? Model extends keyof RequirementsMap[Role]
    ? Action extends keyof RequirementsMap[Role][Model]
    ? RequirementsMap[Role][Model][Action]
    : never
    : never
    : never;

export type PermissionContext<
    RequirementsMap,
    U extends User,
    R extends U["role"],
    Model extends keyof PermissionsWithModels,
    Action extends PermissionsWithModels[Model]["action"],
> = GetDataType<
    RequirementsMap,
    R,
    Model,
    Action
> extends undefined
    ? {
        model: Model;
        action: Action;
        user: U;
        data?: undefined;
    }
    : {
        model: Model;
        action: Action;
        user: U;
        data: GetDataType<RequirementsMap, R, Model, Action>;
    };

export interface PermissionReturnType {
    allowed: boolean;
    matchedRole: UserRole | null;
    reason: string;
}
