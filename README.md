# ShelterSync
ShelterSync is a MERN stack pet adoption platform. It features user authentication with JWT, CRUD APIs for pet profiles with image upload using GridFS, search and filter capabilities, and an adoption request workflow that emails shelters when someone is interested in a pet.

## Setup

```bash
npm install --prefix server
npm install --prefix client
```

Create a `.env` file in the `server` folder based on `.env.example` and set MongoDB and email credentials:

```
MONGO_URI=mongodb://localhost/sheltersync
JWT_SECRET=supersecret
EMAIL_USER=you@example.com
EMAIL_PASS=password
EMAIL_SERVICE=gmail
EMAIL_FROM=you@example.com
PORT=5000
```

The `EMAIL_SERVICE` and `EMAIL_FROM` settings are used by the nodemailer
transport. For Gmail you may need to create an app password or enable
"less secure" access. Update these variables with the credentials for
your SMTP provider.

Start the development environment:

```bash
npm run dev
```

## Project Structure

```
server/
  models/      Mongoose models
  routes/      Express route handlers
  server.js    API entry
client/
  src/         React application
```

## Sample API Route

```http
GET /pets?breed=husky&age=2
```
Returns all husky pets that are two years old.

## React Component Example

```jsx
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
```

## Mongoose Schemas

`Pet` model:
```js
const petSchema = new mongoose.Schema({
  name: String,
  breed: String,
  age: Number,
  healthNotes: String,
  imageURL: String,
  location: String,
  shelter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
```

`AdoptionRequest` model:
```js
const adoptionRequestSchema = new mongoose.Schema({
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  adopter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });
```
