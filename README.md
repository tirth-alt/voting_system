# College Election Voting System - Next.js Application

A fully responsive college election voting application built with Next.js, featuring preference-based voting, MongoDB integration, and an admin dashboard.

## 🚀 Features

- **Secure PIN-based Voting**: 6-digit PIN authentication
- **Preference Voting System**: Support for ranked-choice voting (Preference 1 & 2)
- **House-based Voting**: Students vote for their house captain positions
- **NOTA Support**: "None of the Above" option for all positions
- **Admin Dashboard**: Real-time results, vote management, and system controls
- **MongoDB Integration**: Persistent data storage with fallback support
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB instance)

## 🛠️ Installation

1. **Install Dependencies**
   ```bash
   cd nextjs-app
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file in the `nextjs-app` directory:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college-election?retryWrites=true&w=majority
   SESSION_SECRET=your_super_secret_session_key_change_this_in_production
   NODE_ENV=development
   PORT=3000
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. **Seed the Database** (if needed)
   You'll need to run the seed script from the parent backend folder to initialize:
   - Admin accounts
   - Candidates
   - Initial PIN
   - Config settings

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```
The application will be available at `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

## 📁 Project Structure

```
nextjs-app/
├── src/
│   ├── app/
│   │   ├── api/              # API routes
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── candidates/   # Candidate data
│   │   │   ├── pin/          # PIN validation
│   │   │   └── vote/         # Vote submission
│   │   ├── admin/            # Admin dashboard pages
│   │   ├── globals.css       # Global styles
│   │   ├── layout.js         # Root layout
│   │   └── page.js           # Main voting page
│   ├── lib/
│   │   ├── mongodb.js        # Database connection
│   │   └── adminAuth.js      # Admin authentication
│   ├── models/               # Mongoose models
│   │   ├── Admin.js
│   │   ├── Candidate.js
│   │   ├── Config.js
│   │   └── Vote.js
│   └── data/
│       └── candidates.json   # Candidate data
├── public/
│   ├── assets/               # Images and logos
│   └── css/                  # CSS files
├── package.json
└── .env.local               # Environment variables (create this)
```

## 🔑 Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

**Voting PIN:**
- Default: `123456`

⚠️ **Important**: Change these in production!

## 🎯 API Endpoints

### Public Endpoints
- `GET /api/candidates` - Fetch all candidates
- `POST /api/pin/validate` - Validate voting PIN
- `POST /api/vote` - Submit a vote

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/check-auth` - Check authentication status
- `POST /api/admin/change-pin` - Update voting PIN
- `POST /api/admin/toggle-voting` - Open/close voting
- `GET /api/admin/config` - Get system configuration
- `GET /api/admin/tally` - Get election results
- `GET /api/admin/votes` - Get vote statistics
- `GET /api/admin/export` - Export results as CSV
- `POST /api/admin/reset-all` - Reset all votes (requires confirmation)

## 🏠 Houses

- **Leo** (Gold/Orange gradient)
- **Phoenix** (Red gradient)
- **Tusker** (Green gradient)
- **Kong** (Blue gradient)

## 📊 Voting Positions

1. Male President
2. Female President
3. Academic Secretary
4. Sports Secretary
5. Cultural Secretary
6. Campus Affairs Secretary (Single choice)
7. House Captains (Leo, Phoenix, Tusker, Kong)

## 🔒 Security Features

- Bcrypt password hashing
- Session-based authentication
- PIN validation
- Rate limiting on vote endpoints
- Secure cookie handling
- MongoDB injection protection

## 🎨 Tech Stack

- **Frontend**: Next.js 16, React 19
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: bcrypt, session cookies
- **Styling**: Vanilla CSS with modern design
- **Export**: JSON to CSV conversion

## 📝 License

MIT

## 👨‍💻 Author

Made with ❤️ by Tirth Shah

---

For more information or support, please refer to the main project README in the parent directory.
