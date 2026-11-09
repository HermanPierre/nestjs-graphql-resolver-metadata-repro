**Title:** `@Resolver()` without a type no longer sets `RESOLVER_TYPE_METADATA` since 14.2.0, silently disabling global guards that rely on it

### Is there an existing issue for this?

- [x] I have searched the existing issues

### Current behavior

Since 14.2.0, a class decorated with `@Resolver()` (no argument) or `@Resolver({ ...options })` (options only) no longer carries the `RESOLVER_TYPE_METADATA` metadata. In 14.1.2 the metadata was always defined (with an `undefined` value for untyped resolvers), so `Reflect.hasMetadata(RESOLVER_TYPE_METADATA, cls)` returned `true` for every resolver class.

The change comes from 1e678c7 ("fix(graphql): run every resolver with its declared enhancers"), which now wraps `addResolverMetadata(...)` in `if (name) { ... }` so that a child resolver does not shadow the type inherited from its parent.

`RESOLVER_TYPE_METADATA` is exported from the package root, and checking it from a global guard is a common way to tell GraphQL resolvers apart from REST controllers (see #1867). For example:

```ts
@Injectable()
export class GlobalGqlAuthGuard extends AuthGuard("session") {
  canActivate(context: ExecutionContext) {
    const isResolver = Reflect.hasMetadata(RESOLVER_TYPE_METADATA, context.getClass());
    if (!isResolver) return true; // REST controllers have their own guards
    return super.canActivate(GqlExecutionContext.create(context) /* ... */);
  }
}
```

After upgrading to 14.2.0 (a minor release), every untyped `@Resolver()` class is treated as "not a resolver" by such a guard: its queries are no longer authenticated, `req.user` stays empty, and any `@CurrentUser()`-style param decorator receives `null`. In our application this made some queries reachable without a session and broke others with `Cannot read properties of null`. Nothing fails at startup or at compile time.

### Minimum reproduction code

<link to the reproduction repository>

```js
import "reflect-metadata";
import { Query, Resolver, RESOLVER_TYPE_METADATA } from "@nestjs/graphql";

class SomeResolver {
  ping() {
    return true;
  }
}
Query(() => Boolean)(SomeResolver.prototype, "ping", Object.getOwnPropertyDescriptor(SomeResolver.prototype, "ping"));
Resolver()(SomeResolver);

console.log(Reflect.hasMetadata(RESOLVER_TYPE_METADATA, SomeResolver));
// 14.1.2 -> true
// 14.2.0 -> false
```

### Steps to reproduce

1. `npm install --legacy-peer-deps`
2. `npm run repro`

| Decorator | 14.1.2 | 14.2.0 |
| --- | --- | --- |
| `@Resolver()` | `true` | `false` |
| `@Resolver("Query")` | `true` | `true` |
| `@Resolver({ isAbstract: false })` | `true` | `false` |

### Expected behavior

Either:

- every class decorated with `@Resolver()` keeps being identifiable as a resolver through `RESOLVER_TYPE_METADATA` (for instance by defining the key on the class even when no type is given, while still letting an inherited type win), or
- the change is documented as breaking in the release notes, with the recommended way to detect a resolver at runtime (e.g. `context.getType<GqlContextType>() === "graphql"`).

### Package version

14.2.0 (`@nestjs/graphql`, `@nestjs/apollo`)

### Graphql version

graphql: 17.1.0

### NestJS version

12.3.3

### Node.js version

24.22.2

### In which operating systems have you tested?

- [x] macOS
- [ ] Windows
- [ ] Linux

### Other

We worked around it by detecting GraphQL requests with `context.getType<GqlContextType>() === "graphql"` instead of the resolver metadata.
