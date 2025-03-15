# Claims Management Platform - Backend

A robust backend service for managing insurance claims, built with Node.js, Express, and MongoDB.

## Features

- User Authentication (Patients & Insurers)
- Claim Submission & Management
- File Upload with Supabase Storage
- Real-time Updates using Socket.IO
- Role-based Access Control
- Comprehensive API Documentation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Supabase Account
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd claims-management/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
cp .env.example .env
```

4. Update the `.env` file with your configuration:
- MongoDB URI
- JWT Secret
- Supabase credentials
- Other environment variables

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Authentication Endpoints

#### Register User
- **POST** `/api/auth/register`
- Body:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "patient"
}
```

#### Login User
- **POST** `/api/auth/login`
- Body:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Claims Endpoints

#### Submit Claim (Patient only)
- **POST** `/api/claims`
- Headers: `Authorization: Bearer <token>`
- Body: FormData
  - name: string
  - email: string
  - claimAmount: number
  - description: string
  - document: file

#### Get All Claims (Insurer only)
- **GET** `/api/claims`
- Headers: `Authorization: Bearer <token>`
- Query Parameters:
  - status: string (pending/approved/rejected)
  - startDate: date
  - endDate: date
  - minAmount: number
  - maxAmount: number

#### Get User's Claims (Patient only)
- **GET** `/api/claims/my-claims`
- Headers: `Authorization: Bearer <token>`

#### Update Claim Status (Insurer only)
- **PATCH** `/api/claims/:id/status`
- Headers: `Authorization: Bearer <token>`
- Body:
```json
{
  "status": "approved",
  "approvedAmount": 1000,
  "insurerComments": "Claim approved"
}
```

#### Get Single Claim
- **GET** `/api/claims/:id`
- Headers: `Authorization: Bearer <token>`

## Real-time Updates

The application uses Socket.IO for real-time updates. When a claim status is updated, all connected clients will receive the update automatically.

## Error Handling

All endpoints return appropriate HTTP status codes and error messages in the following format:
```json
{
  "message": "Error message here"
}
```

## Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- File upload size limits
- CORS protection

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

ISC 