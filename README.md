# 🚒 大埔救急 Save TaiPo

**大埔救急** 係一個針對為受大埔宏福苑火災影響嘅街坊同救援義工而設嘅即時資訊整合平台。

**Save TaiPo** is a disaster relief coordination platform developed in response to the Tai Po Wang Fuk Court Fire (November 2025).

火災初期，有好多熱心街坊想幫手，但網上資訊太散亂：
- 物資錯配：有人送水去已爆滿嘅站，有人餓緊但無人知。
- 交通擠塞：外區車手塞死大埔公路，阻礙救援。
- 訊息零碎：救援資訊散落幾十個TG Group，義工未必睇得切。

呢個App嘅目的係整合所有資訊，轉化做一睇就明嘅地圖同任務，確保每分民間力量都用得其所。

## Project Structure

The application consists of a React frontend and a Firebase-based backend.

- **/frontend**: Contains the React (Vite) frontend application. See `frontend/README.md` for more details.
- **/backend**: Contains the Firebase Functions (Node.js/Express) backend. See `backend/README.md` for more details.
- **firebase.json**: Firebase project configuration.
- **firestore.rules**: Firestore security rules.

## Features

-   **Station Management**: Users can view and manage relief stations.
-   **Task Coordination**: Volunteers can view and claim tasks for delivering supplies.
-   **Real-time Alerts**: Admins can broadcast important alerts to all users.
-   **User Roles & Permissions**: The app supports different user roles (e.g., residents, volunteers, station managers).

## Technology Stack

-   **Frontend**: React, Vite, TypeScript, React Router, Firebase Authentication
-   **Backend**: Node.js, Express, Firebase Functions, Firestore
-   **Deployment**: Frontend is deployed on Vercel, Backend on Firebase.

## Prerequisites

-   Node.js (v20 or higher recommended)
-   Firebase CLI (`npm install -g firebase-tools`)
-   Vercel CLI (`npm install -g vercel`) (optional, for frontend deployment)

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/gracetyy/safe_tai_po.git
    cd safe_tai_po
    ```

2.  **Set up the Backend:**
    -   Navigate to the backend directory: `cd backend`
    -   Install dependencies: `npm install`
    -   Follow the instructions in `backend/README.md` to configure your Firebase project.

3.  **Set up the Frontend:**
    -   Navigate to the frontend directory: `cd ../frontend`
    -   Install dependencies: `npm install`
    -   Create a `.env` file by copying `.env.example`.
    -   Fill in the necessary Firebase and API configuration in the `.env` file as described in `frontend/README.md`.

## Available Scripts

### Backend (`/backend`)

-   `npm run serve`: Run the backend locally using Firebase emulators.
-   `npm run deploy`: Deploy the backend functions to Firebase.
-   `npm run logs`: View logs from the deployed Firebase functions.

### Frontend (`/frontend`)

-   `npm run dev`: Start the frontend development server.
-   `npm run build`: Build the frontend for production.
-   `npm run preview`: Preview the production build locally.

## Deployment

### Backend

To deploy the backend, navigate to the `/backend` directory and run:

```bash
npm run deploy
```

### Frontend

The frontend is designed for Vercel. You can deploy it by connecting your fork of this repository to a Vercel project or by using the Vercel CLI.

Navigate to the `/frontend` directory and run:

```bash
vercel
```
# License
This project is licensed under the MIT License - see the LICENSE file for details.

# Acknowledgments
感謝所有在前線救火的消防員 🔥

感謝所有無私奉獻的車手、步兵同社工 🙏

Data sourced from community Telegram groups: [大埔救援群組集合](https://t.me/Taipohelper)

Built with ❤️ by Hong Kong Developers.