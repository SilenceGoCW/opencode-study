#!/usr/bin/env bun
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function main() {
  try {
    // Source WASM file path
    const wasmSourcePath = path.join(
      process.cwd(),
      'local-deps/ghostty-web/ghostty-vt.wasm'
    );

    // Destination directory
    const publicDir = path.join(process.cwd(), 'public');

    // Check if the source WASM file exists
    try {
      await fs.stat(wasmSourcePath);
      // Copy the WASM file to the public directory
      await fs.copyFile(wasmSourcePath, path.join(publicDir, 'ghostty-vt.wasm'));
      console.log('✅ Copied ghostty-vt.wasm to public directory');
    } catch (error) {
      console.warn('⚠️  ghostty-vt.wasm file not found, skipping copy');
      console.warn('Please build the WASM file first by running:');
      console.warn('  cd local-deps/ghostty-web && bun run build:wasm');
      // Continue without exiting
    }
  } catch (error) {
    console.error('Error copying WASM file:', error);
    // Continue without exiting
  }
}

main();
