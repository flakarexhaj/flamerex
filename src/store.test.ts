import { beforeEach, expect, test } from "vitest";
import { useStore } from "./store";
import { seedEvents } from "./data";

beforeEach(() => {
  useStore.setState({ events: seedEvents(20), selectedId: null });
});

test("addEvent puts a new open event at the top", () => {
  const before = useStore.getState().events.length;
  useStore.getState().addEvent();
  const { events } = useStore.getState();
  expect(events).toHaveLength(before + 1);
  expect(events[0].status).toBe("open");
});

test("updateStatus changes only the chosen event", () => {
  const [first, second] = useStore.getState().events;
  useStore.getState().updateStatus(first.id, "resolved");
  const { events } = useStore.getState();
  expect(events.find((e) => e.id === first.id)?.status).toBe("resolved");
  expect(events.find((e) => e.id === second.id)?.status).toBe(second.status);
});

test("select stores and clears the selected id", () => {
  useStore.getState().select(5);
  expect(useStore.getState().selectedId).toBe(5);
  useStore.getState().select(null);
  expect(useStore.getState().selectedId).toBeNull();
});