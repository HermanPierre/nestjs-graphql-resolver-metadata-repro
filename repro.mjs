import "reflect-metadata";

function decorate(gql, resolverArgs) {
  class SomeResolver {
    ping() {
      return true;
    }
  }
  gql.Query(() => Boolean)(SomeResolver.prototype, "ping", Object.getOwnPropertyDescriptor(SomeResolver.prototype, "ping"));
  gql.Resolver(...resolverArgs)(SomeResolver);
  return SomeResolver;
}

const cases = [
  ["@Resolver()", []],
  ['@Resolver("Query")', ["Query"]],
  ["@Resolver({ isAbstract: false })", [{ isAbstract: false }]],
];

for (const version of ["14.1.2", "14.2.0"]) {
  const gql = await import(`@nestjs/graphql-${version}`);
  console.log(`\n@nestjs/graphql ${version}`);
  for (const [label, args] of cases) {
    const cls = decorate(gql, args);
    console.log(
      `  ${label.padEnd(34)} hasMetadata(RESOLVER_TYPE_METADATA) = ${Reflect.hasMetadata(gql.RESOLVER_TYPE_METADATA, cls)}`,
    );
  }
}
