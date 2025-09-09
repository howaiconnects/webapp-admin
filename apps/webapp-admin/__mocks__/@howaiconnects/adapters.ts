// Jest manual mock for @howaiconnects/adapters used in local Jest runs.
// This shim prevents resolution errors when Jest tries to import the monorepo package.
// Exports minimal adapter classes so tests that import types/constructors can run and be mocked by jest.mock().
export class LatitudeAdapter {
  constructor(..._args: any[]) {}
  // add any commonly-used methods as no-op placeholders if tests call them
  async request(_opts?: any) {
    return null
  }
}

export class AirtableAdapter {
  constructor(..._args: any[]) {}
  async request(_opts?: any) {
    return null
  }
}

export class MiroAdapter {
  constructor(..._args: any[]) {}
  async request(_opts?: any) {
    return null
  }
}

// export a default object as well (in case some code does default imports)
export default {
  LatitudeAdapter,
  AirtableAdapter,
  MiroAdapter,
}