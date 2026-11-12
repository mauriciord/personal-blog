export const THEME_STORAGE_KEY = "blog-theme";

export function getInitialTheme(storage) {
  try {
    return storage?.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setTheme(theme, root, storage) {
  const selected = theme === "light" ? "light" : "dark";
  root.dataset.theme = selected;
  try {
    storage?.setItem(THEME_STORAGE_KEY, selected);
  } catch {
    /* Storage may be disabled. */
  }
  return selected;
}

export function initializeThemeControls({
  root,
  toggles,
  storage,
  stickyButton,
  stickyBoundary,
  IntersectionObserverClass = globalThis.IntersectionObserver,
}) {
  root.dataset.theme = getInitialTheme(storage);
  const updateToggles = () => {
    const light = root.dataset.theme === "light";
    for (const toggle of toggles) {
      toggle.setAttribute(
        "aria-label",
        `Switch to ${light ? "dark" : "light"} theme`,
      );
      toggle.setAttribute("aria-pressed", String(light));
      const label = toggle.querySelector(".theme-toggle-label");
      if (label) label.textContent = light ? "Dark" : "Light";
      const icon = toggle.querySelector("[aria-hidden]");
      if (icon) icon.textContent = light ? "☾" : "☼";
    }
  };
  const listeners = [];
  for (const toggle of toggles) {
    const onClick = () => {
      setTheme(
        root.dataset.theme === "light" ? "dark" : "light",
        root,
        storage,
      );
      updateToggles();
    };
    toggle.addEventListener("click", onClick);
    listeners.push([toggle, onClick]);
  }
  updateToggles();

  let observer;
  if (stickyButton) {
    const setStickyVisible = (visible) => {
      stickyButton.hidden = !visible;
      stickyButton.tabIndex = visible ? 0 : -1;
      stickyButton.setAttribute("aria-hidden", String(!visible));
    };
    setStickyVisible(false);
    if (IntersectionObserverClass && stickyBoundary) {
      try {
        observer = new IntersectionObserverClass((entries) => {
          for (const entry of entries) {
            if (entry.target === stickyBoundary) {
              setStickyVisible(
                !entry.isIntersecting && entry.boundingClientRect.bottom < 0,
              );
            }
          }
        });
        observer.observe(stickyBoundary);
      } catch {
        setStickyVisible(false);
      }
    }
  }

  return () => {
    observer?.disconnect();
    for (const [toggle, listener] of listeners)
      toggle.removeEventListener("click", listener);
  };
}
