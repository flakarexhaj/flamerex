import { describe, expect, test } from "vitest";
import { makeEvent, seedEvents } from "./data";

describe("seedEvents", () => {
  test("returns the requested number of events", () => {
    expect(seedEvents(50)).toHaveLength(50);
  });

  test("sorts events newest first", () => {
    const times = seedEvents(50).map((e) => e.time);
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });
});

describe("makeEvent", () => {
  test("new events start as open", () => {
    expect(makeEvent(Date.now()).status).toBe("open");
  });

  test("creates a valid IPv4 address", () => {
    expect(makeEvent(Date.now()).ip).toMatch(/^\d{1,3}(\.\d{1,3}){3}$/);
  });
});