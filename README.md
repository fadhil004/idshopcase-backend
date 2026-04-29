# idshopcase Backend

This is the backend API for the idshopcase e-commerce platform. It is built with Node.js, Express, and PostgreSQL (via Sequelize). It provides robust features for user authentication, product management, cart & order processing, shipping integration (J&T), and payment gateway integration (DOKU).

## Technologies Used

*   **Node.js & Express**: Core application framework.
*   **PostgreSQL**: Relational database for persistent storage.
*   **Sequelize**: ORM for database modeling and migrations.
*   **Redis**: In-memory data store for caching and rate limiting.
*   **Docker**: Containerization for reliable development and deployment.

## Project Structure

*   `config/`: Database configuration (`config.json`).
*   `controllers/`: Business logic and request handlers for various routes.
*   `middlewares/`: Custom middlewares (authentication, file upload, validation schemas, rate limiting).
*   `migrations/`: Sequelize database migration scripts.
*   `models/`: Sequelize database models.
*   `routes/`: API route definitions.
*   `seeders/`: Initial database seeding data (e.g., admin users).
*   `services/`: External API integrations (DOKU payment, J&T shipping).
*   `jobs/`: Background cron jobs (e.g., expiring unpaid pending payments).
*   `utils/`: Helper and utility functions.
*   `uploads/`: Local storage for uploaded files (e.g., profile pictures, product images).

## Getting Started

### Prerequisites

*   [Node.js](https://nodejs.org/) (v24 or later recommended)
*   [Docker & Docker Compose](https://www.docker.com/) (Recommended for easiest setup)

### Environment Variables

Copy the provided example files to create your local configurations:

```bash
cp .env.example .env
cp config/config.example.json config/config.json
```

**Critical Environment Variables:**
*   `PORT`: Server port (default is `5000`).
*   `JWT_SECRET`: A strong, random string for signing JWT authentication tokens.
*   `DATABASE_URL`: Connection string for PostgreSQL (e.g., `postgresql://postgres:YOUR_PASSWORD@localhost:5432/idshopcase`).
*   `REDIS_URL`: Connection string for Redis.
*   `FRONTEND_URL`: Allowed origin for CORS (e.g., `https://idshopcase.com`).
*   `DOKU_*`: Credentials for DOKU payment gateway integration.
*   `JNT_*`: Credentials for J&T Express shipping integration.

*(Note: The server will refuse to start if critical variables like `JWT_SECRET` or database credentials are missing).*

### Running with Docker (Recommended for Production)

The application is heavily optimized for Docker. Using the `docker-compose.yml` found in the root directory:

```bash
# Build and start the backend, database, and cache
docker compose up -d backend postgres redis
```

### Running Locally (Development Mode)

If you prefer to run the Node app directly on your host machine:

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start Local DB/Redis:**
    Ensure you have PostgreSQL and Redis running locally. Update your `.env` to point `DB_HOST` and `DATABASE_URL` to `localhost` instead of the Docker service name (`postgres`).
3.  **Run Migrations:**
    ```bash
    npx sequelize-cli db:migrate
    ```
4.  **Run Seeders (Optional):**
    ```bash
    npx sequelize-cli db:seed:all
    ```
5.  **Start Development Server:**
    ```bash
    npm run dev
    ```

## API Endpoints

All application routes are prefixed with `/api`.

*   **`/api/auth`**: Registration, Login, OTP verification, Password Reset.
*   **`/api/user`**: User profiles and shipping addresses management.
*   **`/api/product`**: Product catalog, details, and admin management.
*   **`/api/cart`**: Shopping cart operations.
*   **`/api/order`**: Order checkout and status tracking.
*   **`/api/doku`**: Webhook endpoint for receiving DOKU payment status updates.
*   **`/api/jnt-address`**: Shipping address references (provinces, cities, districts).
*   **`/api/images`**: Image upload endpoints.

**Health Check:** A public endpoint is available at `/health` to verify server uptime.

## Security & Deployment Features

*   **Rate Limiting**: strict rate limiting is applied to authentication endpoints (login, register, forgot-password) using Redis to prevent brute force attacks.
*   **Helmet**: Configured to secure HTTP headers.
*   **CORS Protection**: In production, browser requests are restricted to the domains listed in `FRONTEND_URL`. (Direct server-to-server or curl requests are permitted).
*   **File Upload Validation**: Strict file type and size validation for profile pictures and product images.
*   **Automated Deployment**: Includes a GitHub Actions workflow (`.github/workflows/backend-deploy.yml`) for zero-downtime deployment to the VPS via SSH and Docker.
