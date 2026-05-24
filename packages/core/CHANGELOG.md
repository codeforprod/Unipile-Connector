# @prodforcode/unipile-core

## 0.4.0

### Minor Changes

- Add backward-compatible Unipile v2 configuration, route helpers, typed auth/messaging/LinkedIn/webhook primitives, and NestJS v2 module configuration support.
- Build the package as dual ESM/CommonJS with conditional exports for Node ESM import and CommonJS require consumers.

### Patch Changes

- 161cb9f: Rename npm scope from @unipile to @prodforcode

  This is the first release under the @prodforcode scope. The @unipile npm scope
  belongs to the official Unipile organization, so packages are now published as:
  - @prodforcode/unipile-core
  - @prodforcode/unipile-nestjs

## 0.2.0

### Minor Changes

- 2f98f31: Initial public release of Unipile Connector packages
  - @unipile/core: Framework-agnostic API client for Unipile services (email, messaging, LinkedIn Sales Navigator)
  - @unipile/nestjs: NestJS module integration with dependency injection support
