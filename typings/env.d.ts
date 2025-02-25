/* Copyright © 2025, CosmicMind, Inc. */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly LIB_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}