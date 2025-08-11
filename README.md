# ShelterSync
ShelterSync is a MERN stack pet adoption platform. It features user authentication with JWT, CRUD APIs for pet profiles with image upload using GridFS, search and filter capabilities, and an adoption request workflow that emails shelters when someone is interested in a pet.

## Features

- **User Roles**: Three distinct user types - Adopters, Shelters, and Admins
- **Pet Management**: Shelters can add, edit, and delete pet profiles with images
- **Adoption Workflow**: Complete adoption request system with email notifications
- **Admin Dashboard**: Comprehensive admin panel for platform management
- **Search & Filter**: Find pets by breed, age, and location
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

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

## Testing

Run the client test suite:

```bash
npm test
```

Additional test commands are available:

```bash
npm run test:coverage
npm run test:ci
```

## Creating an Admin User

To create an admin user, run the seed script:

```bash
cd server
node scripts/seedAdmin.js
```

This will create an admin user with:
- Email: `admin@sheltersync.com`
- Password: `admin123`

**Important**: Change the password after first login!

## Seeding Sample Data

Populate the database with sample shelters, adopters, pets, and adoption requests:

```bash
npm run seed --prefix server
```

This script clears existing data and inserts a large dataset for testing.


## User Roles & Features

### Adopters
- Browse available pets
- Submit adoption requests
- View status of their adoption requests
- Receive email notifications on request updates

### Shelters
- Add new pets to the platform
- Edit/delete their own pets
- View and manage adoption requests for their pets
- Approve or reject adoption requests
- Receive email notifications for new requests

### Admins
- Access comprehensive admin dashboard
- View platform statistics
- Manage all users (view, delete)
- Manage all pets (view, delete)
- Monitor all adoption requests
- Full platform oversight

## Project Structure

```
server/
  models/         Mongoose models (User, Pet, AdoptionRequest)
  routes/         Express route handlers
    auth.js       Authentication routes
    admin.js      Admin management routes
    pets.js       Pet CRUD operations
    adoption.js   Adoption request management
    images.js     Image upload/retrieval
  scripts/        Utility scripts
  server.js       API entry point
client/
  src/
    components/   React components
      AdminDashboard.js      Admin panel
      AdoptionRequests.js    Shelter request management
      MyAdoptionRequests.js  Adopter request view
      PetList.js            Browse pets
      PetDetail.js          Pet details & adoption
      PetForm.js            Add/edit pets
    App.js        Main app with routing
    AuthContext.js Authentication context
```

## API Routes

### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - User login

### Pets
- `GET /pets` - List all pets (with filters)
- `GET /pets/:id` - Get pet details
- `POST /pets` - Add new pet (shelter only)
- `PUT /pets/:id` - Update pet (shelter only)
- `DELETE /pets/:id` - Delete pet (shelter only)

### Adoption Requests
- `POST /adopt/:petId` - Submit adoption request
- `GET /adopt/shelter/requests` - Get shelter's requests
- `GET /adopt/my-requests` - Get user's requests
- `PATCH /adopt/:requestId/status` - Update request status

### Admin
- `GET /auth/admin/users` - List all users
- `DELETE /auth/admin/users/:id` - Delete user
- `GET /auth/admin/stats` - Platform statistics
- `GET /adopt/admin/all` - All adoption requests

## Mongoose Schemas

`User` model:
```js
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['adopter', 'shelter', 'admin'], default: 'adopter' },
  location: String
});
```

`Pet` model:
```js
const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
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
