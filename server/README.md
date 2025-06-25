# MindZero Group Backend

## How to Run

1. Open a terminal and navigate to the `server` directory:
   ```sh
   cd server
   ```
2. Install dependencies (if not already done):
   ```sh
   npm install
   ```
3. Start the server:
   ```sh
   node index.js
   ```

The server will run on [http://localhost:3001](http://localhost:3001).

## API Endpoints

- `POST /api/groups/create` — Create a group
  - Body: `{ groupName, username }`
- `POST /api/groups/join` — Join a group
  - Body: `{ code, username }`
- `GET /api/groups/list?username=...` — List groups for a user
- `POST /api/groups/leave` — Leave a group
  - Body: `{ code, username }`

This backend uses in-memory storage for demo purposes. All data will be lost when the server restarts. 