import { beforeEach, expect, test } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EventTable from "./EventTable";
import { useStore } from "../store";
import type { SecurityEvent } from "../types";

const make = (id: number, over: Partial<SecurityEvent>): SecurityEvent => ({
  id,
  time: Date.now() - id * 1000,
  type: "XSS",
  severity: "low",
  status: "open",
  ip: `10.0.0.${id}`,
  country: "Germany",
  target: "api.gateway",
  ...over,
});

beforeEach(() => {
  useStore.setState({
    events: [
      make(1, { type: "Phishing", severity: "critical", country: "Russia" }),
      make(2, { type: "DDoS", severity: "low", country: "Brazil" }),
      make(3, { type: "XSS", severity: "high", country: "Brazil" }),
    ],
    selectedId: null,
  });
});

test("renders a row for every event", () => {
  render(<EventTable />);
  expect(screen.getAllByRole("row")).toHaveLength(4); // header + 3 events
});

test("search filters the rows", async () => {
  const user = userEvent.setup();
  render(<EventTable />);
  await user.type(screen.getByLabelText("Search events"), "Russia");
  expect(screen.getAllByRole("row")).toHaveLength(2);
  expect(screen.getByText("Phishing")).toBeInTheDocument();
});

test("severity filter keeps only matching events", async () => {
  const user = userEvent.setup();
  render(<EventTable />);
  await user.selectOptions(screen.getByLabelText("Filter by severity"), "high");
  expect(screen.getAllByRole("row")).toHaveLength(2);
});

test("clicking a row selects the event", async () => {
  const user = userEvent.setup();
  render(<EventTable />);
  await user.click(screen.getByText("DDoS"));
  expect(useStore.getState().selectedId).toBe(2);
});

test("clicking a status changes it without selecting the row", async () => {
  const user = userEvent.setup();
  render(<EventTable />);
  const row = screen.getByText("Phishing").closest("tr")!;
  await user.click(within(row).getByRole("button", { name: "open" }));
  expect(useStore.getState().events.find((e) => e.id === 1)?.status).toBe("investigating");
  expect(useStore.getState().selectedId).toBeNull();
});