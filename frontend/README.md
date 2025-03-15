# Aarogya Claims - Insurance Claims Management Platform

Aarogya Claims is an elegant and enchanting web application for managing insurance claims. The platform allows patients to submit insurance claims and insurers to review and manage those claims.

## Features

### Patient Portal
- **Submit Claims**: Easily submit new insurance claims with supporting documents
- **View Claims**: Track the status of all submitted claims
- **Claim Details**: View detailed information about each claim

### Insurer Portal
- **Claims Dashboard**: View and filter all submitted claims
- **Claim Review**: Review claim details and supporting documents
- **Claim Management**: Approve or reject claims with comments

## Tech Stack

- **Frontend**: React.js with Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **State Management**: React Context API
- **File Storage**: Supabase (mock implementation)
- **Notifications**: React Toastify

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/aarogya-claims.git
cd aarogya-claims/Client
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Demo Accounts

For testing purposes, you can use the following demo accounts:

- **Patient**: 
  - Email: patient@example.com
  - Password: password

- **Insurer**: 
  - Email: insurer@example.com
  - Password: password

## Project Structure

```
Client/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images and other assets
│   ├── components/      # Reusable components
│   ├── contexts/        # React contexts
│   ├── layouts/         # Layout components
│   ├── pages/           # Page components
│   │   ├── patient/     # Patient-specific pages
│   │   └── insurer/     # Insurer-specific pages
│   ├── services/        # API services
│   └── utils/           # Utility functions
├── index.html           # HTML entry point
└── package.json         # Project dependencies
```

## Deployment

This project can be deployed on any static hosting service like Vercel, Netlify, or GitHub Pages.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Supabase](https://supabase.io/)
- [React Toastify](https://fkhadra.github.io/react-toastify/)

## Integration with Backend

This frontend has been integrated with the Next.js backend API located in the `Backend` folder. The integration includes:

1. **Authentication**: Using NextAuth.js for user authentication instead of mock data
2. **Claims Management**: API calls to the backend for creating, retrieving, and updating claims
3. **File Upload**: Integration with Supabase for document storage via the backend API

### API Communication

The frontend communicates with the backend through these primary services:

- `services/claimService.js`: Handles all claim-related API calls
- `contexts/AuthContext.jsx`: Manages authentication with the backend

### Development Setup

For development, the Vite dev server is configured to proxy API requests to the backend server running on port 3000.

To run the frontend with the backend:

1. Start the backend server:
```bash
cd ../Backend
npm run dev
```

2. Start the frontend development server:
```bash
cd ../Client
npm run dev
```

Alternatively, run both concurrently from the root directory:
```bash
cd ..
npm run dev
```
