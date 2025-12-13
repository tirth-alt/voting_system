# Next.js Application Setup Guide

## Quick Start

### 1. Create Environment File

Copy the environment template and fill in your values:

```bash
cd nextjs-app
cp ENV_TEMPLATE.txt .env.local
```

Then edit `.env.local` with your actual values:
- Replace `MONGODB_URI` with your MongoDB connection string
- Generate a secure `SESSION_SECRET` using: `openssl rand -hex 32`

### 2. Install Dependencies (if not already done)

```bash
npm install
```

### 3. Seed the Database

Before running the Next.js app, you need to seed the database with initial data. Use the seed script from the parent backend folder:

```bash
cd ../backend
node ../scripts/seed.js
```

This will create:
- Admin account (username: `admin`, password: `admin123`)
- All candidates from `candidates.json`
- Initial voting PIN (`123456`)
- System configuration

### 4. Run the Development Server

```bash
cd ../nextjs-app
npm run dev
```

The application will be available at `http://localhost:3000`

## Important Notes

### Environment Variables

The `.env.local` file is gitignored for security. Each developer/deployment needs to create their own.

**Required Variables:**
- `MONGODB_URI` - Your MongoDB connection string
- `SESSION_SECRET` - Random secret for session encryption
- `NODE_ENV` - Set to `development` or `production`
- `NEXT_PUBLIC_API_URL` - API base URL (for client-side requests)

### Default Credentials

**Admin Login:**
- Username: `admin`
- Password: `admin123`

**Voting PIN:**
- Default: `123456`

⚠️ **IMPORTANT**: Change these credentials before deploying to production!

### Database Setup

The application requires MongoDB. You have two options:

1. **MongoDB Atlas (Cloud)** - Recommended for production
   - Create a free account at https://cloud.mongodb.com
   - Create a cluster
   - Get your connection string
   - Whitelist your IP address

2. **Local MongoDB** - For development
   - Install MongoDB locally
   - Use connection string: `mongodb://localhost:27017/college-election`

### File Structure

```
nextjs-app/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes (backend)
│   │   ├── admin/        # Admin pages
│   │   ├── page.js       # Main voting page
│   │   └── layout.js     # Root layout
│   ├── lib/              # Utilities
│   ├── models/           # Mongoose models
│   └── data/             # Static data (candidates.json)
├── public/               # Static assets
│   ├── assets/           # Images, logos
│   └── css/              # Stylesheets
├── .env.local           # Environment variables (create this!)
├── ENV_TEMPLATE.txt     # Environment template
└── package.json
```

## API Routes

All API routes are in `src/app/api/`:

### Public Routes
- `GET /api/candidates` - Get all candidates
- `POST /api/pin/validate` - Validate voting PIN
- `POST /api/vote` - Submit a vote

### Admin Routes (require authentication)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Logout
- `GET /api/admin/check-auth` - Check auth status
- `GET /api/admin/config` - Get system config
- `GET /api/admin/tally` - Get election results
- `GET /api/admin/votes` - Get vote statistics
- `GET /api/admin/export` - Export results as CSV
- `POST /api/admin/change-pin` - Change voting PIN
- `POST /api/admin/toggle-voting` - Open/close voting
- `POST /api/admin/reset-all` - Reset all votes

## Pages

### Voter Pages
- `/` - Main voting interface
  - PIN entry
  - Instructions
  - House selection
  - Voting interface
  - Thank you page

### Admin Pages
- `/admin` - Admin dashboard
  - Login
  - Statistics
  - Vote management
  - Export results

## Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Variables for Production

Make sure to set these in your hosting platform:
- `MONGODB_URI` - Production MongoDB connection
- `SESSION_SECRET` - Strong random secret
- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL` - Your production domain

### Recommended Hosting Platforms

- **Vercel** - Optimized for Next.js (recommended)
- **Railway** - Easy deployment with MongoDB
- **Render** - Free tier available
- **Netlify** - Good Next.js support

## Troubleshooting

### MongoDB Connection Issues
- Check your connection string format
- Verify IP whitelist in MongoDB Atlas
- Ensure network connectivity

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node.js version (requires 18+)

### Session/Cookie Issues
- Verify `SESSION_SECRET` is set
- Check cookie settings in browser
- Ensure HTTPS in production

## Development Tips

### Hot Reload
Next.js supports hot module replacement. Changes to code will automatically reload.

### API Testing
Use the Postman collection from the parent directory to test API endpoints.

### Database Inspection
Use MongoDB Compass or Atlas UI to inspect database contents.

## Support

For issues or questions:
1. Check the main README in the parent directory
2. Review the API documentation
3. Check MongoDB connection logs
4. Verify environment variables are set correctly

---

Made with ❤️ by Tirth Shah
