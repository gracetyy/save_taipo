# TaiPo Disaster Relief App - Backend

Firebase Functions backend for the TaiPo Disaster Relief application.

## Quick Start

```bash
# Install dependencies
npm install

# Login to Firebase
firebase login

# Set your project
firebase use <your-project-id>

# Run locally with emulators
npm run serve

# Deploy to Firebase
npm run deploy
```

## Prerequisites

- Node.js 18+
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project with Firestore enabled

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── stations.ts    # Station CRUD & voting
│   │   ├── tasks.ts       # Delivery task management
│   │   ├── alerts.ts      # Global alert system
│   │   └── votes.ts       # Vote retrieval
│   ├── index.ts           # Express app & Firebase function
│   └── types.ts           # TypeScript types
├── tsconfig.json

The following Firebase configuration files are now located in the root directory:
- `firebase.json`
- `firestore.rules`
- `firestore.indexes.json`
```

## API Endpoints

All endpoints are prefixed with `/api`

### Stations
- `GET /stations` - List all stations
- `GET /stations/:id` - Get station details
- `POST /stations` - Create station
- `PUT /stations/:id` - Update station
- `DELETE /stations/:id` - Delete station
- `POST /stations/:id/vote` - Vote on station
- `POST /stations/seed` - Seed initial data

### Tasks
- `GET /tasks` - List all tasks
- `POST /tasks` - Create task
- `POST /tasks/:id/claim` - Claim task (drivers)
- `POST /tasks/:id/complete` - Complete task

### Alerts
- `GET /alerts` - Get active alert
- `POST /alerts` - Set alert
- `DELETE /alerts` - Clear alert

### Votes
- `GET /votes/:userId/:stationId` - Get specific vote
- `GET /votes/user/:userId` - Get user's votes

## Scripts

- `npm run build` - Compile TypeScript
- `npm run serve` - Run with Firebase emulators
- `npm run deploy` - Deploy to Firebase
- `npm run logs` - View function logs
