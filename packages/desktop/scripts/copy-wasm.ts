#!/usr/bin/env bun
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

async function main() {
  try {
    // Source WASM file path
    const wasmSourcePath = path.join(
      process.cwd(),
      '../app/local-deps/ghostty-web/ghostty-vt.wasm'
    );

    // Destination directory
    const distDir = path.join(process.cwd(), 'dist');

    // Check if the source WASM file exists
    try {
      await fs.stat(wasmSourcePath);
      // Copy the WASM file to the dist directory
      await fs.copyFile(wasmSourcePath, path.join(distDir, 'ghostty-vt.wasm'));
      console.log('✅ Copied ghostty-vt.wasm to dist directory');
    } catch (error) {
      console.warn('⚠️  ghostty-vt.wasm file not found, skipping copy');
      console.warn('Please build the WASM file first by running:');
      console.warn('  cd ../app/local-deps/ghostty-web && bun run build:wasm');
      // Continue without exiting
    }
  } catch (error) {
    console.error('Error copying WASM file:', error);
    // Continue without exiting
  }
}

main();