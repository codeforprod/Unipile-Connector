import type { ModuleMetadata, Type } from '@nestjs/common';
import type { UnipileConfig } from '@prodforcode/unipile-core';

/**
 * Configuration options for the Unipile module.
 */
export interface UnipileModuleOptions extends UnipileConfig {
  /**
   * Whether to register as a global module.
   * @default false
   */
  isGlobal?: boolean;
}

/**
 * Factory for creating Unipile module options.
 */
export interface UnipileOptionsFactory {
  createUnipileOptions(): Promise<UnipileModuleOptions> | UnipileModuleOptions;
}

/**
 * Async configuration options for the Unipile module.
 */
export interface UnipileModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Whether to register as a global module.
   * @default false
   */
  isGlobal?: boolean;

  /**
   * Existing provider to use for options.
   */
  useExisting?: Type<UnipileOptionsFactory>;

  /**
   * Class to instantiate for options.
   */
  useClass?: Type<UnipileOptionsFactory>;

  /**
   * Factory function to create options.
   */
  useFactory?: (...args: unknown[]) => Promise<UnipileModuleOptions> | UnipileModuleOptions;

  /**
   * Dependencies to inject into the factory.
   */
  inject?: unknown[];
}
