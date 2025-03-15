# Claims Management Platform - Next.js Backend

This is the Next.js backend for the Claims Management Platform. It provides API routes for authentication, claim management, and real-time updates using Socket.IO.

## Features

- **Authentication**: User registration, login, and session management
- **Claims Management**: Create, read, update, and delete insurance claims
- **Role-Based Access Control**: Different permissions for patients and insurers
- **File Upload**: Document upload for claims using Supabase storage
- **Real-time Updates**: Socket.IO integration for real-time notifications

## Tech Stack

- **Next.js**: React framework with API routes
- **MongoDB**: Database for storing users and claims
- **Mongoose**: MongoDB object modeling
- **JWT**: JSON Web Tokens for authentication
- **Socket.IO**: Real-time bidirectional event-based communication
- **Supabase**: Storage for claim documents

## Setup Instructions

### Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the `.env` file with your actual credentials:
   - MongoDB URI
   - JWT Secret
   - Supabase configuration (for document storage)

### Supabase Setup for Document Storage

1. Create a Supabase account at [supabase.com](https://supabase.com/) if you don't have one already.

2. Create a new project in Supabase:
   - Note your project URL (e.g., `https://your-project-ref.supabase.co`)
   - Get your service key from Project Settings → API → Service Role Key

3. Set up a storage bucket:
   - Go to Storage → Create a new bucket
   - Name it (e.g., `claims-documents`)
   - Set appropriate permissions (preferably private)
   - Create a folder inside the bucket called `claims`

4. Update your `.env` file with the Supabase details:
```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=claims-documents
```

5. Run the Supabase configuration check script:
```bash
./check-supabase.sh
```

### Running the Application

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

The server will be running at http://localhost:3000 by default.

## API Routes

### Authentication
- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login a user
- `GET /api/auth/session`: Check current session
- `GET /api/auth/profile`: Get user profile
- `POST /api/auth/signout`: Sign out a user

### Claims
- `GET /api/claims`: Get all claims (filtered by user role)
- `POST /api/claims`: Create a new claim
- `GET /api/claims/[id]`: Get a specific claim
- `PUT /api/claims/[id]`: Update a claim
- `DELETE /api/claims/[id]`: Delete a claim

### Health Check
- `GET /api/health`: Check if the server is running

### WebSocket
- `GET /api/socket/io`: Socket.IO endpoint for real-time updates

## Troubleshooting

### Document Retrieval Issues

If you encounter issues with document retrieval:

1. Check your Supabase configuration:
```bash
./check-supabase.sh
```

2. Test document retrieval directly:
```bash
node src/test-document.js claims/your-document-name.pdf
```

3. Check the server logs for detailed error messages.

4. Ensure your Supabase bucket has the right permissions and the document path matches the expected structure.
