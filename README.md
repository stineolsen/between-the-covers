# Bookclub Web Application

A full-featured bookclub management web application built with React, Node.js, Express, and MongoDB.

## Features

- **User Authentication**: Secure invite-only registration with admin approval
- **Book Management**: Browse, review, and rate books
- **Meeting Management**: Organize and track bookclub meetings
- **Reading History**: View past book selections
- **E-shop**: Browse and order bookclub merchandise
- **Admin Dashboard**: Approve/reject pending user registrations

## Tech Stack

### Frontend
- **React** with Vite (fast, modern development)
- **Tailwind CSS** (colorful, playful design)
- **React Router** (navigation)
- **Axios** (API calls)

### Backend
- **Node.js** with Express (REST API)
- **MongoDB** with Mongoose (database)
- **JWT** (authentication via httpOnly cookies)
- **Bcrypt** (password hashing)
- **Multer** (file uploads)

## Project Structure

```
BTC website renewed version/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── api/       # API service layer
│   │   ├── components/ # Reusable React components
│   │   ├── contexts/  # React Context providers
│   │   ├── pages/     # Page components
│   │   └── utils/     # Utility functions
│   └── package.json
│
├── backend/           # Express backend API
│   ├── src/
│   │   ├── config/    # Configuration files
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/ # Custom middleware
│   │   ├── models/    # Mongoose schemas
│   │   ├── routes/    # API routes
│   │   └── utils/     # Utility functions
│   ├── uploads/       # Local image storage
│   └── package.json
│
└── README.md
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **MongoDB** (local installation or MongoDB Atlas)

## Getting Started

### 1. Install MongoDB

#### Option A: Local MongoDB Installation
Download and install MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Update `backend/.env` with your connection string

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

The backend will run on `http://localhost:5000`

**Note**: The backend uses nodemon for auto-restart during development.

### 3. Frontend Setup

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (already done)
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bookclub
JWT_SECRET=bookclub-secret-key-change-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

**Important**: Change the `JWT_SECRET` before deploying to production!

## Usage

### First Time Setup

1. **Start MongoDB** (if running locally)
2. **Start the backend server** (`npm run dev` in backend directory)
3. **Start the frontend** (`npm run dev` in frontend directory)
4. **Open your browser** to `http://localhost:5173`

### Creating the First Admin User

Since this is an invite-only system, you'll need to create the first admin user directly in the database:

#### Option 1: Using MongoDB Compass (GUI)
1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Navigate to `bookclub` database → `users` collection
4. After registering a user through the app, find their document
5. Edit the document:
   - Change `status` from `"pending"` to `"approved"`
   - Change `role` from `"member"` to `"admin"`

#### Option 2: Using MongoDB Shell (Terminal)
```bash
# Connect to MongoDB
mongosh

# Switch to bookclub database
use bookclub

# Find your user and update to admin
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { status: "approved", role: "admin" } }
)
```

### User Flow

1. **Register**: New users create an account (status: pending)
2. **Admin Approval**: Admin logs in and approves pending users
3. **Access**: Approved users can now login and access all features

## Available Scripts

### Backend
- `npm start` - Run the server in production mode
- `npm run dev` - Run the server with nodemon (auto-restart)

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/pending` - Get pending users (admin only)
- `PUT /api/auth/approve/:id` - Approve/reject user (admin only)

### Health Check
- `GET /api/health` - Check if server is running

## Design

The app features a colorful and playful yet sophisticated design:

- **Primary Color**: Deep Purple (#7C3AED)
- **Secondary Color**: Coral Pink (#FB7185)
- **Accent Color**: Teal (#14B8A6)
- **Background**: Warm Cream (#FEF3C7)
- **Text**: Rich Charcoal (#1F2937)

## Current Features (Phase 1)

✅ User registration and authentication
✅ Invite-only system with admin approval
✅ JWT authentication with httpOnly cookies
✅ Protected routes
✅ Admin dashboard
✅ Responsive design
✅ Beautiful UI with Tailwind CSS

## Coming Soon (Phase 2+)

- 📚 Book management (CRUD operations)
- ⭐ Book reviews and ratings
- 📅 Meeting management
- 📖 Reading history
- 🛒 E-shop with contact form checkout
- 🔗 Calibre-web integration
- 📱 Enhanced mobile experience

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check MongoDB Compass
- Verify connection string in `backend/.env`
- Check MongoDB is listening on port 27017

### Port Already in Use
- Backend (5000): Change `PORT` in `backend/.env`
- Frontend (5173): Vite will automatically use next available port

### CORS Errors
- Ensure `FRONTEND_URL` in `backend/.env` matches your frontend URL
- Check CORS configuration in `backend/src/app.js`

### Can't Login After Registration
- Remember: new users need admin approval!
- Create first admin user using MongoDB Compass or shell (see above)
- Check user status in database

## Development Tips

- Use MongoDB Compass for easy database visualization
- Use browser DevTools to inspect cookies and network requests
- Check terminal for backend errors and logs
- Frontend hot-reloads automatically on file changes
- Backend restarts automatically with nodemon

## Security Notes

- Passwords are hashed with bcrypt (10 salt rounds)
- JWTs stored in httpOnly cookies (protected from XSS)
- CORS configured for specific frontend origin
- Validation on both frontend and backend
- Only approved users can access protected routes

## Contributing

This is a bookclub project. To add new features:

1. Follow the existing folder structure
2. Create components in appropriate directories
3. Add new routes in `backend/src/routes/`
4. Add new API calls in `frontend/src/api/`
5. Update this README with new features

## License

Private bookclub project.

## Support

For issues or questions, refer to the implementation plan in `.claude/plans/`.

---

**Happy Reading! 📚**
