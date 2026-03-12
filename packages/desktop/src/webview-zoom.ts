// Copyright 2019-2024 Tauri Programme within The Commons Conservancy
// SPDX-License-Identifier: Apache-2.0
// SPDX-License-Identifier: MIT

import { invoke } from "@tauri-apps/api/core"
import { type as ostype } from "@tauri-apps/plugin-os"
import { createSignal } from "solid-js"

type Os = ReturnType<typeof ostype> | "unknown"

const tauri = () => (window as unknown as { __TAURI__?: unknown }).__TAURI__

const guess = (): Os => {
  if (navigator.userAgent.includes("Mac")) return "macos"
  if (navigator.userAgent.includes("Windows")) return "windows"
  if (navigator.userAgent.includes("Linux")) return "linux"
  return "unknown"
}

const [os, setOs] = createSignal<Os>(guess())

if (tauri()) {
  try {
    setOs(ostype())
  } catch {}
}

const [webviewZoom, setWebviewZoom] = createSignal(1)

const MAX_ZOOM_LEVEL = 10
const MIN_ZOOM_LEVEL = 0.2

const clamp = (value: number) => Math.min(Math.max(value, MIN_ZOOM_LEVEL), MAX_ZOOM_LEVEL)

const applyZoom = (next: number) => {
  setWebviewZoom(next)
  if (!tauri()) return
  void invoke("plugin:webview|set_webview_zoom", {
    value: next,
  }).catch(() => {})
}

window.addEventListener("keydown", (event) => {
  if (!(os() === "macos" ? event.metaKey : event.ctrlKey)) return

  let newZoom = webviewZoom()

  if (event.key === "-") newZoom -= 0.2
  if (event.key === "=" || event.key === "+") newZoom += 0.2
  if (event.key === "0") newZoom = 1

  applyZoom(clamp(newZoom))
})

export { webviewZoom }
