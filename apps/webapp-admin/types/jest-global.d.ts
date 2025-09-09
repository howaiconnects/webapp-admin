/**
 * Stronger Jest-style global typings (loose `any` internals) to avoid Cypress/Chai collisions.
 *
 * This file provides the minimal named matchers and helper shapes used in the test suite:
 * - expect.any, expect.objectContaining
 * - jest.Mock and jest.fn
 * - common matchers: toBe, toEqual, toHaveBeenCalledWith, toContain, toHaveProperty
 *
 * Keep this permissive to avoid interfering with other test frameworks in the monorepo.
 */

export {}

declare global {
  var expect: ExpectFunction
  var jest: any

  namespace NodeJS {
    interface Global {
      expect: ExpectFunction
      jest: any
    }
  }
}

// Minimal Jest namespace/types used in tests
declare namespace jest {
  type Mock = any
  type MockInstance = any

  function fn<T = any, Y = any>(implementation?: (...args: any[]) => any): Mock
  function spyOn(obj: any, method: string): Mock
  const clearAllMocks: () => void
  const resetAllMocks: () => void
  const restoreAllMocks: () => void
}

// Provide a shape for expect(...).matcher calls
interface Matcher {
  toHaveBeenCalledWith(...args: any[]): any
  toHaveBeenCalled(): any
  toBe(value: any): any
  toEqual(value: any): any
  toContain(value: any): any
  toHaveProperty(key: string): any
  // allow chaining with .not
  not?: Matcher
}

interface ExpectFunction {
  (actual: any): Matcher
  objectContaining(obj: any): any
  any(ctor: any): any
  // allow accessing matchers directly like expect.any
  [key: string]: any
}

// Declare globals (implementation-free)
declare const expect: ExpectFunction
declare const jest: any

// Provide a minimal module declaration for @jest/globals so tests that import it
// resolve under TypeScript while keeping types permissive.
declare module '@jest/globals' {
  export const expect: ExpectFunction
  export const jest: any
  export {}
}

export default undefined