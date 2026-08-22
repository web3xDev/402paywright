"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

type Options = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Number of items in the menu. */
  count: number;
  /** Mark items arrow-nav should skip (e.g. coming-soon chains). */
  isDisabled?: (index: number) => boolean;
  /** Item to land on when the menu opens (e.g. the current selection). */
  initialIndex?: number;
  /** listbox = single-select (Select), menu = a list of actions. */
  role: "listbox" | "menu";
};

/**
 * Shared keyboard + focus + ARIA wiring for the trigger-and-popup dropdowns
 * (ChainDropdown / MethodSelect / SampleDropdown). Gives them the behaviour a
 * native <select> has for free: arrow-key roving focus that skips disabled
 * rows, Home/End, Escape-to-close (returning focus to the trigger), Tab-closes,
 * outside-click-closes, and the aria-haspopup/expanded/controls + role wiring
 * that screen readers need. The visual markup stays in each component.
 */
export function useMenuKeyboard({
  open,
  setOpen,
  count,
  isDisabled,
  initialIndex = 0,
  role,
}: Options) {
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const isEnabled = useCallback(
    (i: number) => i >= 0 && i < count && !isDisabled?.(i),
    [count, isDisabled],
  );

  const firstEnabled = useCallback(() => {
    for (let i = 0; i < count; i++) if (isEnabled(i)) return i;
    return -1;
  }, [count, isEnabled]);

  const lastEnabled = useCallback(() => {
    for (let i = count - 1; i >= 0; i--) if (isEnabled(i)) return i;
    return -1;
  }, [count, isEnabled]);

  // Step to the next/previous enabled item, wrapping around the ends.
  const step = useCallback(
    (from: number, dir: 1 | -1) => {
      let i = from;
      for (let s = 0; s < count; s++) {
        i = (i + dir + count) % count;
        if (isEnabled(i)) return i;
      }
      return from;
    },
    [count, isEnabled],
  );

  const close = useCallback(
    (returnFocusToTrigger: boolean) => {
      setOpen(false);
      if (returnFocusToTrigger) {
        triggerRef.current?.focus();
      } else if (containerRef.current?.contains(document.activeElement)) {
        // Don't leave focus stranded on a row that's about to be aria-hidden.
        (document.activeElement as HTMLElement | null)?.blur();
      }
    },
    [setOpen],
  );

  // On open, land on the current selection (or the first enabled row); reset on
  // close. This is React's render-time "adjust state when a prop changes"
  // pattern (https://react.dev/reference/react/useState#storing-information-from-previous-renders),
  // tracking the previous open in state — no setState-in-effect, no ref writes
  // in render. A separate effect moves DOM focus onto the active row.
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setActiveIndex(open ? (isEnabled(initialIndex) ? initialIndex : firstEnabled()) : -1);
  }

  useEffect(() => {
    if (open && activeIndex >= 0) itemsRef.current[activeIndex]?.focus();
  }, [open, activeIndex]);

  // Close on click outside the whole trigger+popup wrapper.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [setOpen]);

  const onTriggerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (open) return;
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        // Suppress the synthetic click so the menu opens instead of toggling.
        e.preventDefault();
        setOpen(true);
      }
    },
    [open, setOpen],
  );

  const onMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((a) => step(a < 0 ? -1 : a, 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((a) => step(a < 0 ? count : a, -1));
          break;
        case "Home":
          e.preventDefault();
          setActiveIndex(firstEnabled());
          break;
        case "End":
          e.preventDefault();
          setActiveIndex(lastEnabled());
          break;
        case "Escape":
          e.preventDefault();
          close(true);
          break;
        case "Tab":
          close(false);
          break;
      }
    },
    [step, count, firstEnabled, lastEnabled, close],
  );

  return {
    containerRef,
    triggerRef,
    activeIndex,
    /** Call after a selection instead of `setOpen(false)` directly — also
     *  blurs whatever item still has real DOM focus. Without it, a row that
     *  was keyboard-focused (e.g. the previous selection, focused when the
     *  menu opened) keeps that focus after you click a different row —
     *  clicking a button doesn't reliably move focus on every platform
     *  (notably macOS Safari/Chrome) — so its `focus:` highlight stays
     *  visually "stuck" even though it's no longer selected. */
    close,
    /** Spread onto the trigger <button>. */
    triggerProps: {
      onKeyDown: onTriggerKeyDown,
      "aria-haspopup": role,
      "aria-expanded": open,
      "aria-controls": menuId,
    } as const,
    /** Spread onto the popup container. */
    menuProps: {
      id: menuId,
      role,
      onKeyDown: onMenuKeyDown,
      "aria-hidden": !open,
    } as const,
    /** Spread onto each item <button>; the component adds its own role
     *  (menuitem / menuitemradio) plus key/onClick/className.
     *
     *  Deliberately no onMouseEnter here: moving real DOM focus on hover
     *  used to make the `focus:` highlight (meant for keyboard nav) stick
     *  around after the mouse left the row, since nothing blurs it. Mouse
     *  hover is left to plain CSS `:hover` — inherently transient, nothing
     *  to get stuck. Keyboard users still get roving focus via the arrow
     *  handlers above. */
    getItemProps: (index: number) => ({
      ref: (el: HTMLButtonElement | null) => {
        itemsRef.current[index] = el;
      },
      tabIndex: open && activeIndex === index ? 0 : -1,
    }),
  };
}
