import { useEffect, useState } from 'react';

export default function PetList() {
    const [pets, setPets] = useState([]);

    useEffect(() => {
        fetch('/pets')
            .then(res => res.json())
            .then(setPets);
    }, []);

    return (
        <ul>
            {pets.map(p => (
                <li key={p._id}>{p.name} - {p.breed}</li>
            ))}
        </ul>
    );
}