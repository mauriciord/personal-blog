import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { getInitialTheme, setTheme } from "../src/lib/theme.js";
import * as theme from "../src/lib/theme.js";

function memoryStorage(initial = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key, next) => {
      value = next;
    },
    value: () => value,
  };
}

test("uses dark as the initial theme unless light was explicitly saved", () => {
  assert.equal(getInitialTheme(memoryStorage()), "dark");
  assert.equal(getInitialTheme(memoryStorage("light")), "light");
  assert.equal(getInitialTheme(memoryStorage("invalid")), "dark");
});

test("switching themes updates the root and persists the explicit choice", () => {
  const storage = memoryStorage();
  const root = { dataset: {} };
  assert.equal(setTheme("light", root, storage), "light");
  assert.equal(root.dataset.theme, "light");
  assert.equal(storage.value(), "light");
  assert.equal(setTheme("dark", root, storage), "dark");
  assert.equal(storage.value(), "dark");
});

test("continues to work when storage access is denied", () => {
  const denied = {
    getItem() {
      throw new Error("denied");
    },
    setItem() {
      throw new Error("denied");
    },
  };
  assert.equal(getInitialTheme(denied), "dark");
  const root = { dataset: {} };
  assert.equal(setTheme("light", root, denied), "light");
  assert.equal(root.dataset.theme, "light");
});

test("the CSS default preserves the original dark palette without JavaScript", () => {
  const css = readFileSync(
    new URL("../src/style/global.css", import.meta.url),
    "utf8",
  );
  const root = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
  const token = (name) =>
    root.match(new RegExp(`--${name}:\\s*([^;]+)`))?.[1].trim();
  assert.equal(token("page"), "#252525");
  assert.equal(token("text"), "#efefef");
  assert.equal(token("gray"), "#a4a4a4");
  assert.equal(token("nav-bg"), "rgba(37, 37, 37, 0.7)");
  assert.match(css, /:root\s*\{[^}]*color-scheme:\s*dark/s);
  assert.match(css, /h1,\s*strong,\s*b\s*\{\s*color:\s*var\(--text\)/);
  assert.match(css, /blockquote\s*\{[^}]*color:\s*var\(--text\)/s);
  assert.match(css, /pre\s*\{[^}]*background:\s*var\(--pre-bg\)/s);
});

test("the scoped theme toggle uses the selected theme text token", () => {
  const header = readFileSync(
    new URL("../src/components/Header.astro", import.meta.url),
    "utf8",
  );
  const style = header.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const toggle = style.match(/\.theme-toggle\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(toggle, /color:\s*var\(--text\)/);
});

for (const page of ["newsletter.astro", "pt-BR/newsletter.astro"]) {
  test(`${page} respects the selected theme rather than the OS theme`, () => {
    const source = readFileSync(
      new URL(`../src/pages/${page}`, import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(source, /prefers-color-scheme/);
    assert.match(source, /background:\s*var\(--pink-surface, var\(--pink\)\)/);
    assert.match(
      source,
      /\.form-message\.success\s*\{[^}]*color:\s*var\(--active-text, var\(--black\)\)/s,
    );
  });
  test(`${page} scopes newsletter form colors to semantic theme tokens`, () => {
    const source = readFileSync(
      new URL(`../src/pages/${page}`, import.meta.url),
      "utf8",
    );
    const style = source.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
    const input =
      style.match(
        /\.subscribe-form input\[type="email"\]\s*\{([^}]*)\}/,
      )?.[1] ?? "";
    assert.match(input, /border:\s*2px solid var\(--text\)/);
    assert.match(input, /background:\s*var\(--surface\)/);
    assert.match(input, /(?:^|;)\s*color:\s*var\(--text\)/);
    const button =
      style.match(/\.subscribe-form button\s*\{([^}]*)\}/)?.[1] ?? "";
    assert.match(button, /background:\s*var\(--text\)/);
    assert.match(button, /(?:^|;)\s*color:\s*var\(--page\)/);
  });
}

test("light palette and shared controls are wired to accessible theme choice", () => {
  const css = readFileSync(
    new URL("../src/style/global.css", import.meta.url),
    "utf8",
  );
  const light =
    css.match(/:root\[data-theme="light"\]\s*\{([^}]*)\}/)?.[1] ?? "";
  assert.match(light, /--page:\s*#fbf8f1/);
  assert.match(light, /--text:\s*#292b27/);
  assert.match(light, /--active-text:\s*#ffffff/);
  assert.match(light, /--pre-bg:\s*#252525/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  const header = readFileSync(
    new URL("../src/components/Header.astro", import.meta.url),
    "utf8",
  );
  assert.match(header, /aria-label="Switch to light theme"/);
  assert.match(header, /initializeThemeControls\(/);
  assert.match(header, /querySelectorAll\("\.theme-toggle"\)/);
});

test("theme switcher is grouped with language controls, outside the navigation", () => {
  const header = readFileSync(
    new URL("../src/components/Header.astro", import.meta.url),
    "utf8",
  );
  const asideStart = header.indexOf('<div class="header-aside">');
  const asideEnd = header.indexOf(
    "\n    </div>\n  </div>\n</header>",
    asideStart,
  );
  const nav = header.match(/<nav>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  assert.notEqual(asideStart, -1);
  assert.notEqual(asideEnd, -1);
  assert.match(header.slice(asideStart, asideEnd), /class="theme-toggle"/);
  assert.doesNotMatch(nav, /class="theme-toggle"/);
});

test("sticky navigation has a separately hidden theme switcher", () => {
  const header = readFileSync(
    new URL("../src/components/Header.astro", import.meta.url),
    "utf8",
  );
  const nav = header.match(/<nav>([\s\S]*?)<\/nav>/)?.[1] ?? "";
  assert.match(nav, /class="theme-toggle sticky-theme-toggle"/);
  assert.match(nav, /aria-hidden="true"/);
  assert.match(nav, /hidden/);
  assert.match(header, /stickyBoundary:\s*document\.querySelector\("header"\)/);
  assert.match(header, /<\/header>\s*<nav>/);
  assert.doesNotMatch(header, /sticky-sentinel/);
});

test("sticky switcher visibility follows actual sticking and both controls stay synchronized", () => {
  assert.equal(typeof theme.initializeThemeControls, "function");
  if (typeof theme.initializeThemeControls !== "function") return;

  const createButton = () => {
    const attrs = {};
    const listeners = {};
    const label = { textContent: "Light" };
    const icon = { textContent: "☼" };
    return {
      attrs,
      listeners,
      hidden: false,
      tabIndex: 0,
      setAttribute: (name, value) => {
        attrs[name] = value;
      },
      querySelector: (selector) =>
        selector === ".theme-toggle-label" ? label : icon,
      addEventListener: (type, listener) => {
        listeners[type] = listener;
      },
      label,
      icon,
    };
  };
  const primary = createButton();
  const sticky = createButton();
  let observerCallback;
  let observedTarget;
  class MockIntersectionObserver {
    constructor(callback) {
      observerCallback = callback;
    }
    observe(target) {
      observedTarget = target;
    }
  }
  const boundary = {};
  const root = { dataset: {} };
  const storage = memoryStorage();
  theme.initializeThemeControls({
    root,
    toggles: [primary, sticky],
    storage,
    stickyButton: sticky,
    stickyBoundary: boundary,
    IntersectionObserverClass: MockIntersectionObserver,
  });

  assert.equal(root.dataset.theme, "dark");
  assert.equal(sticky.hidden, true);
  assert.equal(sticky.attrs["aria-hidden"], "true");
  assert.equal(sticky.tabIndex, -1);
  assert.equal(observedTarget, boundary);
  observerCallback([
    {
      target: boundary,
      isIntersecting: true,
      boundingClientRect: { top: -20, bottom: 528 },
    },
  ]);
  assert.equal(
    sticky.hidden,
    true,
    "partially visible header with nav below the viewport is not stuck",
  );
  observerCallback([
    {
      target: boundary,
      isIntersecting: false,
      boundingClientRect: { top: -900, bottom: -372 },
    },
  ]);
  assert.equal(
    sticky.hidden,
    false,
    "nav is shown once the header bottom scrolls above the viewport",
  );
  assert.equal(sticky.tabIndex, 0);

  primary.listeners.click();
  assert.equal(root.dataset.theme, "light");
  assert.equal(storage.value(), "light");
  for (const button of [primary, sticky]) {
    assert.equal(button.attrs["aria-pressed"], "true");
    assert.equal(button.attrs["aria-label"], "Switch to dark theme");
    assert.equal(button.label.textContent, "Dark");
    assert.equal(button.icon.textContent, "☾");
  }

  sticky.listeners.click();
  assert.equal(root.dataset.theme, "dark");
  assert.equal(storage.value(), "dark");
  observerCallback([
    { target: boundary, isIntersecting: true, boundingClientRect: { top: 0, bottom: 528 } },
  ]);
  assert.equal(
    sticky.hidden,
    true,
    "returning to the top hides the sticky copy",
  );
  theme.initializeThemeControls({
    root,
    toggles: [],
    storage,
    stickyButton: sticky,
    stickyBoundary: boundary,
    IntersectionObserverClass: MockIntersectionObserver,
  });
  observerCallback([
    { target: boundary, isIntersecting: false, boundingClientRect: { top: -900, bottom: -372 } },
  ]);
  assert.equal(sticky.hidden, false, "initial restored scroll above the header shows the sticky copy");
});

test("sticky switcher stays hidden when IntersectionObserver is unavailable", () => {
  assert.equal(typeof theme.initializeThemeControls, "function");
  if (typeof theme.initializeThemeControls !== "function") return;
  const attrs = {};
  const stickyButton = {
    hidden: false,
    setAttribute: (name, value) => {
      attrs[name] = value;
    },
  };
  theme.initializeThemeControls({
    root: { dataset: {} },
    toggles: [],
    storage: memoryStorage(),
    stickyButton,
    stickyBoundary: {},
    IntersectionObserverClass: null,
  });
  assert.equal(stickyButton.hidden, true);
  assert.equal(attrs["aria-hidden"], "true");
  assert.equal(stickyButton.tabIndex, -1);
});

test("hidden theme controls override their authored display rule", () => {
  const header = readFileSync(
    new URL("../src/components/Header.astro", import.meta.url),
    "utf8",
  );
  const style = header.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  assert.match(style, /\.theme-toggle\[hidden\]\s*\{\s*display:\s*none\s*;/);
});

test("language and theme controls share the same explicit rendered height", () => {
  const header = readFileSync(
    new URL("../src/components/Header.astro", import.meta.url),
    "utf8",
  );
  const style = header.match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? "";
  const rule = (selector) =>
    style.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? "";
  const themeToggle = rule("\\.theme-toggle");
  const languageToggle = rule("\\.language-toggle");
  const height = (css) => css.match(/height:\s*([^;]+)/)?.[1].trim();
  assert.equal(height(themeToggle), "2rem");
  assert.equal(height(languageToggle), "2rem");
  assert.match(themeToggle, /box-sizing:\s*border-box/);
  assert.match(languageToggle, /box-sizing:\s*border-box/);
});

test("the actual head initializer uses saved light and falls back dark on denied storage", () => {
  const head = readFileSync(
    new URL("../src/components/BaseHead.astro", import.meta.url),
    "utf8",
  );
  const script = head.match(/<script is:inline>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(script);
  for (const [storage, expected] of [
    [{ getItem: () => "light" }, "light"],
    [
      {
        getItem: () => {
          throw Error("denied");
        },
      },
      "dark",
    ],
  ]) {
    const document = { documentElement: { dataset: {} } };
    runInNewContext(script, { document, localStorage: storage });
    assert.equal(document.documentElement.dataset.theme, expected);
  }
});
