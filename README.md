# NodeJS Menu API

A robust REST API for managing restaurant menus, branches, and orders, built with Node.js, Express, and PostgreSQL.

## Features

- **Multi-tenant Architecture**: Support for Restaurants, Branches, and Users.
- **Menu Management**: Manage Categories, Offers, and Menu Images.
- **Authentication**: JWT-based authentication for secure access.
- **File Uploads**: S3 integration for uploading menu images.
- **Documentation**: Comprehensive Swagger (OpenAPI) documentation.
- **Performance**: Response compression and rate limiting enabled.

## Prerequisites

- **Node.js** (v16+)
- **PostgreSQL** (v13+)
- **AWS S3 Bucket** (for image uploads)

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd nodejs-menu-api-v1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy the example config file:
   ```bash
   cp config.env.example config.env
   ```
   Edit `config.env` and fill in your database credentials and AWS S3 details.

## Running the Application

### Development Mode
Runs the server with hot-reloading:
```bash
npm run dev
```

### Production Mode
Builds and starts the server:
```bash
npm run build
npm start
```

The server will start at `http://localhost:8000`.

## API Documentation

The API Documentation is available via Swagger UI at:

**[http://localhost:8000/api/docs](http://localhost:8000/api/docs)**

## Project Structure

- `src/app.ts`: Application entry point and middleware setup.
- `src/modules/`: Feature-based modules (Controllers, Services, Routes).
- `src/db/`: Database configuration and Drizzle ORM schemas.
- `src/config/`: Environment configuration.

## Contributing

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.
