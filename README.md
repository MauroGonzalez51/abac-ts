# abac-ts-engine

Attribute-Based Access Control (ABAC) engine for TypeScript

## Installation

```bash
npm install abac-ts-engine
```

```bash
pnpm add abac-ts-engine
```

```bash
yarn add abac-ts-engine
```

## Usage

```typescript
import type { PermissionsWithRoles } from "abac-ts-engine";
import { createEngine, permission } from "abac-ts-engine";

// 1. Declare your types
declare module "abac-ts-engine" {
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

// 2. Define your permissions
const roles = {
    admin: {
        Post: {
            view: true,
            create: true,
            delete: permission.required(({ user, data }) =>
                user.id === data?.authorId
            ),
        },
    },
    user: {
        Post: {
            view: true,
        },
    },
} as const satisfies PermissionsWithRoles;

// 3. Create the engine
const engine = createEngine(roles);

// 4. Check permissions
const canView = engine.hasPermission({
    model: "Post",
    action: "view",
    user: { id: "1", role: "user" },
});

const canDelete = engine.hasPermission({
    model: "Post",
    action: "delete",
    user: { id: "1", role: "admin" },
    data: { id: "1", authorId: "1" },
});
```

## Features

- 🚀 Full TypeScript support with type safety
- ✨ Simple and intuitive API
- 🔒 Attribute-Based Access Control
- 📦 ESM and CommonJS support
- ⚡ Zero dependencies
- 🎯 Role hierarchy support
- 🔍 Permission explanation with `explain()`

## API

### `createEngine(roles, options?)`

Creates a new ABAC engine with the specified roles and permissions.

**Options:**

- `roleHierarchy`: Define role inheritance (optional)

```typescript
const engine = createEngine(roles, {
    roleHierarchy: {
        admin: ["admin", "user"],
        user: ["user"],
    },
});
```

### `engine.hasPermission(context)`

Checks if a permission is granted.

```typescript
engine.hasPermission({
    model: "Post",
    action: "view",
    user: { id: "1", role: "admin" },
    data: { id: "1", authorId: "1" }, // optional
});
```

### `engine.explain(context)`

Returns detailed information about the permission check.

```typescript
const result = engine.explain({
    model: "Post",
    action: "delete",
    user: { id: "1", role: "admin" },
    data: { id: "1", authorId: "1" },
});

console.log(result);
// {
//   allowed: true,
//   matchedRole: 'admin',
//   reason: 'has-permission:matched-function'
// }
```

## Permission Helpers

### `permission.required(fn)`

Requires data to be present. Returns `false` if data is undefined.

```typescript
permission.required(({ user, data }) => user.id === data?.authorId);
```

### `permission.and.check(...checks)`

All checks must pass.

```typescript
permission.and.check(
    ({ user }) => user.verified,
    ({ user }) => user.active
);
```

### `permission.and.required(...checks)`

All checks must pass and data is required.

### `permission.or.check(...checks)`

At least one check must pass.

```typescript
permission.or.check(
    ({ user }) => user.isAdmin,
    ({ user, data }) => user.id === data?.authorId
);
```

### `permission.or.required(...checks)`

At least one check must pass and data is required.

## License

ISC © [mauro_gonzalez5147](https://github.com/MauroGonzalez51)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Repository

[GitHub](https://github.com/MauroGonzalez51/abac-ts)
