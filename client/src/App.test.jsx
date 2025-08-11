import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./utils/api", () => ({
	petsAPI: {
		getPets: jest.fn().mockResolvedValue({ data: { data: { pets: [] } } }),
	},
}));

test("renders navigation brand", async () => {
	render(<App />);
	expect(await screen.findByText(/sheltersync/i)).toBeInTheDocument();
});

