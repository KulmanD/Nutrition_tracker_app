import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders login page for logged-out users", () => {
  localStorage.clear();
  render(<App />);
  expect(screen.getByRole("heading", { name: /nutritrack login/i })).toBeInTheDocument();
});
