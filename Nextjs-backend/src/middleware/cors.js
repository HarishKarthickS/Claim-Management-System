import NextCors from 'next-cors';

export function middleware(handler) {
  return async (req, res) => {
    // Apply CORS middleware
    await NextCors(req, res, {
      // Options
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      origin: [
        'https://claim-management-system-rho.vercel.app',  // Production frontend
        'http://localhost:5173'                           // Local development server
      ],
      optionsSuccessStatus: 200,
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With', 'Accept']
    });

    // Call the original handler
    return await handler(req, res);
  };
}

export default middleware;
