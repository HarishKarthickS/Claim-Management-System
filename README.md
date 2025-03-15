# Claims Management Platform

A comprehensive platform for managing insurance claims, built for Aarogya ID's assignment. This solution enables patients to submit and track claims, while insurers can review and manage them efficiently.

## 🚀 Features

### 👤 Patient Side:
- Submit claims with document uploads
- Track claim status and history
- View claim details and insurer feedback

### 🏢 Insurer Side:
- Review and manage submitted claims
- Filter claims by status, date, and amount
- Approve or reject claims with comments

### 🔐 Shared Features:
- Secure authentication for patients and insurers
- Real-time updates using WebSockets
- Responsive design for all devices

## 🛠️ Tech Stack

### Frontend:
- React.js (Vite) for a fast, modern UI
- Tailwind CSS for responsive design
- Socket.IO Client for real-time updates

### Backend:
- Next.js API routes
- MongoDB for data storage
- NextAuth.js for authentication
- Socket.IO for real-time communication

### File Storage:
- Supabase Storage for document uploads

## 📋 Project Structure

```
claims-management/
├── backend/             # Next.js backend
│   ├── models/          # MongoDB schemas
│   ├── pages/api/       # API routes
│   ├── middleware/      # Custom middleware
│   └── server.js        # Custom server configuration
│
└── frontend/            # React/Vite frontend
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Page components
    │   ├── context/     # React context providers
    │   └── services/    # API service functions
    └── public/          # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claims-management
```

2. Set up the backend:
```bash
cd backend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

3. Set up the frontend:
```bash
cd ../frontend
npm install
cp .env.example .env
# Update .env with your configuration
npm run dev
```

4. Access the application:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📱 Screenshots

[Include screenshots of key features here]

## 🔒 Security Features

- NextAuth.js authentication
- Password hashing with bcrypt
- Role-based access control
- Secure file uploads

## 🌟 Standout Features

- Real-time claim status updates
- Comprehensive filtering options for insurers
- Responsive design for all devices
- Detailed audit trail for claims

## 📄 License

MIT Opensource License

## 🙏 Acknowledgements

This project was created as part of the Aarogya ID assignment, focusing on automating OPD insurance claims using modern web technologies. 
