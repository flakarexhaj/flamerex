import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import StatCard from "./StatCard";

test("shows label, value and hint", () => {
  render(<StatCard label="Open events" value={7} hint="Not yet triaged" />);
  expect(screen.getByText("Open events")).toBeInTheDocument();
  expect(screen.getByText("7")).toBeInTheDocument();
  expect(screen.getByText("Not yet triaged")).toBeInTheDocument();
});