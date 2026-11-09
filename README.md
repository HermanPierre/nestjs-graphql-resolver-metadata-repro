# `@Resolver()` without a type no longer sets `RESOLVER_TYPE_METADATA` (14.2.0)

Minimal reproduction for a behavior change between `@nestjs/graphql` 14.1.2 and 14.2.0.

## Run

```sh
npm install --legacy-peer-deps
npm run repro
```

Both versions are installed side by side through npm aliases (`@nestjs/graphql-14.1.2`,
`@nestjs/graphql-14.2.0`). The script decorates the same class with each version and checks
`Reflect.hasMetadata(RESOLVER_TYPE_METADATA, cls)`.

## Output

```
@nestjs/graphql 14.1.2
  @Resolver()                        hasMetadata(RESOLVER_TYPE_METADATA) = true
  @Resolver("Query")                 hasMetadata(RESOLVER_TYPE_METADATA) = true
  @Resolver({ isAbstract: false })   hasMetadata(RESOLVER_TYPE_METADATA) = true

@nestjs/graphql 14.2.0
  @Resolver()                        hasMetadata(RESOLVER_TYPE_METADATA) = false
  @Resolver("Query")                 hasMetadata(RESOLVER_TYPE_METADATA) = true
  @Resolver({ isAbstract: false })   hasMetadata(RESOLVER_TYPE_METADATA) = false
```

The change comes from
[nestjs/graphql@1e678c7](https://github.com/nestjs/graphql/commit/1e678c7a621e658963e889622588b0b90fa82153),
which now calls `addResolverMetadata` only when a name/type is given.
