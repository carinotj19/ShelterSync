import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PetCard from "./PetCard";

const mockPet = {
	id: 1,
	name: "Buddy",
	breed: "Labrador",
	age: 3,
	location: "NY",
};

test("displays pet name", () => {
	render(
		<MemoryRouter>
			<PetCard pet={mockPet} />
		</MemoryRouter>
	);
	expect(screen.getByText(/buddy/i)).toBeInTheDocument();
});
