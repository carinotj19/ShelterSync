import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PetList from "./PetList";

jest.mock("../utils/api", () => ({
	petsAPI: { getPets: jest.fn() },
}));
const { petsAPI } = require("../utils/api");

test("renders pet search heading", async () => {
	petsAPI.getPets.mockResolvedValue({ data: { data: { pets: [] } } });
	render(
		<MemoryRouter>
			<PetList />
		</MemoryRouter>
	);
	expect(await screen.findByText(/find your perfect/i)).toBeInTheDocument();
});
