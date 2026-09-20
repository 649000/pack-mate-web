import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

// Recharts measures its container and its hidden label span with
// getBoundingClientRect. jsdom reports a zero-size box for every element, so a
// chart renders nothing. Give Recharts' own elements a size while leaving all
// other elements untouched.
const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;

function rect(width: number, height: number): DOMRect {
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
  if (this.id === "recharts_measurement_span") {
    return rect((this.textContent ?? "").length * 7, 16);
  }
  if (this.classList?.contains("recharts-responsive-container")) {
    return rect(400, 200);
  }
  return originalGetBoundingClientRect.call(this);
};

if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

if (!globalThis.PointerEvent) {
  globalThis.PointerEvent = MouseEvent as unknown as typeof PointerEvent;
}
