import { type Atom, type WritableAtom, createStore } from "jotai";

const store = createStore();

// Tracks initial values of atoms
const initialValues = new WeakMap<Atom<unknown>, unknown>();

// Patch `sub()` to track initial values on first read
const originalSub = store.sub.bind(store);

store.sub = function <T>(atom: Atom<T>, callback: () => void): () => void {
  // Capture the value before subscription
  if (!initialValues.has(atom)) {
    const value = store.get(atom);
    initialValues.set(atom, value);
    // console.debug('[JotaiNexus] Captured initial value for atom:', atom, value)
  }

  return originalSub(atom, callback);
};

interface Nexus {
  get: <T>(atom: Atom<T>) => T;
  set: <T>(
    atom: WritableAtom<T, [T | ((prev: T) => T)], void>,
    value: T | ((prev: T) => T)
  ) => void;
  reset: <T>(atom: WritableAtom<T, [T | ((prev: T) => T)], void>) => void;
}

const nexus: Nexus = {
  get: <T>(atom: Atom<T>) => {
    const value = store.get(atom);
    // Just in case: capture value on manual get too
    if (!initialValues.has(atom)) {
      initialValues.set(atom, value);
      // console.debug('[JotaiNexus] Captured initial value on manual get:', atom, value)
    }
    return value;
  },

  set: <T>(
    atom: WritableAtom<T, [T | ((prev: T) => T)], void>,
    value: T | ((prev: T) => T)
  ) => {
    store.set(atom, value);
  },

  reset: <T>(atom: WritableAtom<T, [T | ((prev: T) => T)], void>) => {
    if (initialValues.has(atom)) {
      const initialValue = initialValues.get(atom);
      store.set(atom, initialValue as T);
      // console.debug('[JotaiNexus] Reset atom to initial value:', atom, initialValue)
    } else console.warn("[JotaiNexus] No initial value found for atom:", atom);
  },
};

// Utilities to use in app

export function getJotai<T>(atom: Atom<T>): T {
  return nexus.get(atom);
}

export function setJotai<T>(
  atom: WritableAtom<T, [T | ((prev: T) => T)], void>,
  value: T | ((prev: T) => T)
) {
  return nexus.set(atom, value);
}

export function resetJotai<T>(
  atom: WritableAtom<T, [T | ((prev: T) => T)], void>
) {
  return nexus.reset(atom);
}

export { store };
