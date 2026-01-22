# @prodforcode/unipile-core

## 0.3.1

### Patch Changes

- 161cb9f: Rename npm scope from @unipile to @prodforcode

  This is the first release under the @prodforcode scope. The @unipile npm scope
  belongs to the official Unipile organization, so packages are now published as:
  - @prodforcode/unipile-core
  - @prodforcode/unipile-nestjs

## 0.3.0

### Minor Changes

- Implemented ESM/CommonJS dual package support for compatibility with all module systems

### Added

- **Dual Package Support**: Package now supports both ESM (`import`) and CommonJS (`require()`)
- Separate builds for ESM (`dist/esm/`) and CommonJS (`dist/cjs/`)
- CommonJS compatibility for NestJS and other CommonJS environments
- Cross-platform build script for `.cjs` file extension handling

### Changed

- Build process now generates two module formats (ESM and CommonJS)
- Updated package.json exports field with conditional exports (`import`/`require`)
- File extensions: `.js` for ESM, `.cjs` for CommonJS
- Added new TypeScript configurations: `tsconfig.esm.json` and `tsconfig.cjs.json`

### Technical Details

- ESM output: `dist/esm/` with `package.json` marker (`{"type":"module"}`)
- CommonJS output: `dist/cjs/` with explicit `.cjs` extension
- Shared TypeScript definitions in `dist/types/`
- All subpath exports (`/interfaces`, `/enums`, `/services`, `/errors`, `/http`, `/client`) support both formats

### Migration Guide

No breaking changes for existing ESM consumers. CommonJS consumers can now use standard `require()` syntax:

```javascript
// ESM (unchanged)
import { UnipileClient } from '@prodforcode/unipile-core';

// CommonJS (now supported)
const { UnipileClient } = require('@prodforcode/unipile-core');
```

## 0.2.0

### Minor Changes

- 2f98f31: Initial public release of Unipile Connector packages
  - @prodforcode/unipile-core: Framework-agnostic API client for Unipile services (email, messaging, LinkedIn Sales Navigator)
  - @prodforcode/unipile-nestjs: NestJS module integration with dependency injection support
