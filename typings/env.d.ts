/* Copyright © 2024, CosmicMind, Inc. <http://cosmicmind.com>. All rights reserved. */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly LIB_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}