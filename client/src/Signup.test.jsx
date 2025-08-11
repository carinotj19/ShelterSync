import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "./Signup";

jest.mock("../utils/api", () => ({
	authAPI: { signup: jest.fn() },
}));

test("renders signup button", () => {
	render(
		<MemoryRouter>
			<Signup />
		</MemoryRouter>
	);
	expect(
		screen.getByRole("button", { name: /^sign up$/i })
	).toBeInTheDocument();
});
