# TradeFlow

TradeFlow is a real-time trade ingestion dashboard built for the Arham Fintech Software Engineer technical assessment. It simulates fetching trade data from a mock BSE API, stores the imported records in MongoDB, and displays them on a dashboard.

The application handles long-running data pulls through multiple short HTTP requests instead of keeping one connection open for the entire operation. Socket.IO is used to send live progress updates to the dashboard without requiring a page refresh or polling.

## Features

- Fetches mock BSE trade data in batches.
- Displays previously imported trades while a pull is running.
- Shows live pull status and progress using Socket.IO.
- Stores source trades, imported trades, and pull job details in MongoDB.
- Prevents duplicate trade imports using trade IDs.
- Supports trade search, symbol filtering, and sorting.
- Allows trade data to be exported as CSV.
- Tracks pull progress, inserted records, duplicates, and job status.

## Tech Stack

- React and Vite
- JavaScript and CSS
- Node.js and Express
- MongoDB and Mongoose
- Socket.IO

## Prerequisites

Make sure you have the following installed:

- Node.js 20 or later
- npm
- MongoDB Atlas or a local MongoDB instance
- Git

## Getting Started

### 1. Clone the repository

git clone https://github.com/Nikhil-Panchal29/TradeFlow.git
cd TradeFlow


### 2. Set up the backend

cd server
npm install


Create a `.env` file inside the `server` directory:


PORT=4000
MONGODB_URI=your_mongodb_connection_string
CLIENT_ORIGIN=http://localhost:5173
BSE_BASE_URL=http://localhost:4000
BSE_PULL_DURATION_MS=30000
BSE_PAGE_SIZE=50
SEED_COUNT=3000
REQUEST_TIMEOUT_MS=28000
BATCH_RETRY_LIMIT=3


Replace `your_mongodb_connection_string` with your MongoDB connection string.

Start the backend using the script configured in `server/package.json`. If the script is named `dev`, run:


npm run dev

The backend should be available at `http://localhost:4000`.

### 3. Set up the frontend

Open a second terminal from the project root:

cd client
npm install


Create a `.env` file inside the `client` directory:

VITE_API_URL=http://localhost:4000


Start the frontend using the script configured in `client/package.json`. If it is named `dev`, run:

npm run dev


Open the local URL displayed by Vite, usually `http://localhost:5173`.

Keep both the frontend and backend running while using the application.

## Configuration

The `BSE_PULL_DURATION_MS` variable controls the configured pull duration.

- `30000` — 30-second demo pull.
- `900000` — 15-minute pull simulation.

The source data is retrieved in batches, so the application does not need to keep a single HTTP connection open throughout the entire pull.

Do not commit your `.env` files or actual database credentials to GitHub.

## API Endpoints

| Method | Endpoint | Description |
| GET | `/getTrades` | Retrieves mock BSE trades using pagination |
| POST | `/api/pulls` | Starts a new trade pull |
| GET | `/api/pulls/current` | Returns the current or latest pull job |
| GET | `/api/trades` | Retrieves imported trades |
| GET | `/api/stats` | Returns dashboard statistics |
| GET | `/api/health` | Checks backend health |

A successful pull request returns `202 Accepted`. If another pull is already running, the API returns `409 Conflict`.

## Real-Time Updates

The backend uses Socket.IO to send the following events:

| Event | Description |
| `pull:started` | A pull has started |
| `pull:progress` | Progress has been updated after a batch |
| `pull:completed` | The pull has completed |
| `pull:failed` | The pull has failed |

These events allow the dashboard to display pull progress and status changes without periodically requesting updates.

## Database Collections

The application uses three MongoDB collections:

- source_trades —> seeded mock BSE trade records.
- trades —> records imported into the application.
- pulljobs —> pull status, progress, timestamps, and error information.

Each trade contains fields such as `tradeId`, `client`, `symbol`, `quantity`, `price`, and `timestamp`.

## Notes

- The BSE API is mocked; this project does not retrieve live exchange data.
- The ingestion worker runs inside the backend process and is not a durable job queue.
- A backend restart can interrupt an ongoing pull.
- The pull duration can be configured for demonstration purposes.

## Author

**Nikhil Panchal**

[GitHub Profile](https://github.com/Nikhil-Panchal29)

