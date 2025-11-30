# Save TaiPo - Backend

Firebase Functions backend for the TaiPo Disaster Relief application.

## API Documentation

### Alerts API

**Base Path:** `/api/alerts`

| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| GET    | `/global`     | Get the global alert |
| POST   | `/global`     | Set the global alert |
| DELETE | `/global`     | Clear the global alert|

### Auth API

**Base Path:** `/api/auth`

| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| POST   | `/login`      | User login           |

### Categories API

**Base Path:** `/api/categories`

| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| GET    | `/`           | Get all categories   |
| POST   | `/`           | Add a new category   |

### Favorites API

**Base Path:** `/api/favorites`

| Method | Endpoint              | Description                    |
|--------|-----------------------|--------------------------------|
| GET    | `/:userId`            | Get user's favorite stations   |
| POST   | `/:userId`            | Add a station to favorites     |
| DELETE | `/:userId/:stationId` | Remove a station from favorites|

### Items API

**Base Path:** `/api/items`

| Method | Endpoint      | Description               |
|--------|---------------|---------------------------|
| POST   | `/`           | Add an item to a category |

### Roles API

**Base Path:** `/api/roles`

| Method | Endpoint                 | Description                                  |
|--------|--------------------------|----------------------------------------------|
| GET    | `/:userId`               | Get a user's role                            |
| POST   | `/self-update`           | Allow users to self-update their role        |
| POST   | `/request-driver`        | Request to become a driver                   |
| POST   | `/approve-driver/:userId`| Approve a driver request (admin only)        |
| POST   | `/reject-driver/:userId` | Reject a driver request (admin only)         |
| GET    | `/driver-requests`       | Get all pending driver requests (admin only) |
| POST   | `/self-claim-volunteer`  | Self-claim volunteer role                    |
| PUT    | `/:userId`               | Set a user's role (admin only)               |
| GET    | `/`                      | Get all users (admin only)                   |

### Stations API

**Base Path:** `/api/stations`

| Method | Endpoint                     | Description                                    |
|--------|------------------------------|------------------------------------------------|
| POST   | `/seed`                      | Seed stations with initial data (admin only)   |
| GET    | `/`                          | Get all stations                               |
| GET    | `/:id`                       | Get a single station by ID                     |
| GET    | `/:id/users`                 | Get station members by ID                      |
| POST   | `/`                          | Create a new station (admin/station manager)   |
| PUT    | `/:id`                       | Update a station (admin/station manager)       |
| DELETE | `/:id`                       | Delete a station (admin/station manager)       |
| DELETE | `/:id/offerings/:offering`   | Delete an offering from a station (admin/station manager) |
| DELETE | `/:id/needs/:need`           | Delete a need from a station (admin/station manager)     |
| POST   | `/:id/vote`                  | Vote on a station (upvote/downvote)            |
| POST   | `/:id/users`                 | Add a user to a station (admin/station manager)|
| DELETE | `/:id/users`                 | Remove a user from a station (admin/station manager)|

### Tasks API

**Base Path:** `/api/tasks`

| Method | Endpoint         | Description                            |
|--------|------------------|----------------------------------------|
| GET    | `/`              | Get all tasks                          |
| GET    | `/:id`           | Get a single task by ID                |
| POST   | `/`              | Create a new task (admin/station manager)|
| PUT    | `/:id`           | Update a task (admin/station manager)  |
| POST   | `/:id/claim`     | Claim a task (admin/station manager/driver)|
| POST   | `/:id/complete`  | Complete a task (admin/station manager/driver)|
| DELETE | `/:id`           | Delete a task (admin/station manager)  |

### Transport API

**Base Path:** `/api/transport`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/` | Create a new transport task (station manager/admin) |
| GET | `/` | Get all transport tasks |
| GET | `/:id` | Get a specific transport task |
| PUT | `/:id` | Update a transport task (station manager/admin/driver) |
| DELETE | `/:id` | Delete a transport task (station manager/admin) |

### Users API

**Base Path:** `/api/users`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/self-update` | Self-update user preferences |

### Votes API

**Base Path:** `/api/votes`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:userId/:stationId` | Get user's vote for a station |
| GET | `/user/:userId` | Get all votes for a user |
