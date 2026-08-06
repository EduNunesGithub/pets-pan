declare const brand: unique symbol;

export type OrganizationScope = string & {
  readonly [brand]: "organization-scope";
};
