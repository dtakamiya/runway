import "@testing-library/jest-dom"
import { webcrypto } from "crypto"

// jsdom 環境で crypto.randomUUID が使えるようにポリフィル
Object.defineProperty(globalThis, "crypto", {
  value: webcrypto,
})

// jsdom 環境で window.matchMedia が使えるようにモック
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
})
