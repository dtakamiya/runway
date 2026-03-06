import "@testing-library/jest-dom"
import { webcrypto } from "crypto"

// jsdom 環境で crypto.randomUUID が使えるようにポリフィル
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
})
