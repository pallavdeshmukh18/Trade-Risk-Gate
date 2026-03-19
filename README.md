# Trade-Risk-Gate

## Google OAuth setup

Add these environment variables before using Google sign-in:

### Backend

```bash
JWT_SECRET=your-jwt-secret
MONGO_URI=your-mongodb-uri
GOOGLE_CLIENT_ID=your-google-oauth-web-client-id
```

### Frontend

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-web-client-id
```

Use the same Google web client ID on both sides. In Google Cloud Console, add `http://localhost:3000` to Authorized JavaScript origins for local development.
