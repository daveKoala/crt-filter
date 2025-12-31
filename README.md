# CRT Scanner Service

A Node.js/Express/TypeScript service for scanning certificate transparency logs.

## Setup

Install dependencies:

```bash
npm install
```

## Running the Service

Development mode (with auto-reload):
```bash
npm run dev
```

Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### POST /scan

Initiate a scan of certificate transparency logs.

**Request Body:**
```json
{
  "logs": ["google-argon2023"],
  "window": "6months"
}
```

**Response:**
```json
{
  "message": "Scan initiated",
  "logs": ["google-argon2023"],
  "window": "6months"
}
```

## Project Structure

```
crt-scanner/
├── src/
│   └── index.ts        # Main application file
├── dist/               # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── .gitignore
```
