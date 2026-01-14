export interface UserRoleMap { }

export type UserRole = keyof UserRoleMap;

export interface User {
    role: UserRole;
}

export type Action = "view" | "create" | "delete" | "update";

export type PermissionFunction<K extends keyof PermissionsWithModels> = (ctx: {
    user: User;
    data?: PermissionsWithModels[K]["dataType"];
}) => boolean;

export type CheckPermission<K extends keyof PermissionsWithModels> =
    | boolean
    | PermissionFunction<K>;

export interface Models {}

export type MakePermissionsWithModels<T> = {
    [K in keyof T]: {
        dataType: T[K];
        action: Action;
    };
};

export type PermissionsWithModels = MakePermissionsWithModels<Models>;

export type PermissionSet<K extends keyof PermissionsWithModels> = {
    [A in Action]?: CheckPermission<K>;
};

export type PermissionsWithRoles = {
    [R in UserRole]: {
        [K in keyof PermissionsWithModels]?: PermissionSet<K>;
    };
};

export interface PermissionContext<
    Model extends keyof PermissionsWithModels,
    Action extends PermissionsWithModels[Model]["action"],
> {
    model: Model;
    action: Action;
    user: User;
    data?: PermissionsWithModels[Model]["dataType"];
}

export interface PermissionReturnType {
    allowed: boolean;
    matchedRole: PropertyKey | null;
    reason: string;
}
