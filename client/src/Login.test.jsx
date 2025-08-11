import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "./Login";
import { AuthContext } from "../AuthContext";

jest.mock("../utils/api", () => ({
	authAPI: { login: jest.fn() },
}));

test("renders login button", () => {
	render(
		<AuthContext.Provider
			value={{
				setAuth: jest.fn(),
				token: null,
				role: null,
				logout: jest.fn(),
			}}
		>
			<MemoryRouter>
				<Login />
			</MemoryRouter>
		</AuthContext.Provider>
	);
	expect(
		screen.getByRole("button", { name: /sign in/i })
	).toBeInTheDocument();
});
