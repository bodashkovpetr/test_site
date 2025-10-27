# YourStyle Backend API Documentation

Backend API for YourStyle furniture e-commerce platform. Built with Node.js, Express, PostgreSQL, and JWT authentication.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Products](#products)
  - [Cart](#cart)
  - [Orders](#orders)
- [Authentication](#authentication-flow)
- [Error Handling](#error-handling)
- [Database Schema](#database-schema)

---

## Overview

This backend provides RESTful APIs for:
- User registration and authentication (JWT-based)
- Product catalog management
- Shopping cart operations
- Order processing and history

**Base URL:** `http://yourstyle.space/api` (or `http://localhost:3000/api` for local development)

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Authentication:** JWT (JSON Web Tokens)
- **Password Hashing:** bcrypt
- **Validation:** express-validator
- **CORS:** Enabled for specified domains
- **Security:** Helmet.js

---

## Getting Started

See [SETUP.md](SETUP.md) for detailed installation instructions.

### Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start Docker containers (PostgreSQL + pgAdmin)
docker-compose up -d

# Run migrations
npm run migrate

# Seed products data
npm run seed

# Start server (development)
npm run dev

# Start server (production)
npm start
```

---

## API Endpoints

### Health Check

Check if the API is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-19T12:00:00.000Z",
  "environment": "production"
}
```

---

## Authentication

### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password",
  "name": "John Doe",
  "phone": "+1234567890"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890",
      "created_at": "2025-10-19T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation Rules:**
- `email`: Valid email address (required)
- `password`: Minimum 6 characters (required)
- `name`: Minimum 2 characters (required)
- `phone`: Optional

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

---

### Login User

Authenticate and receive JWT token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "secure_password"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+1234567890"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

---

## Products

### Get All Products

Retrieve all products, optionally filtered by category.

**Endpoint:** `GET /api/products`

**Query Parameters:**
- `category` (optional): Filter by category (`tables`, `chairs`, `lamps`)

**Example Request:**
```
GET /api/products
GET /api/products?category=tables
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "t1",
      "name": "Стол Aero X",
      "category": "tables",
      "price_cents": 49900,
      "image_url": "",
      "description": "Минималистичный стол с алюминиевыми вставками.",
      "created_at": "2025-10-19T12:00:00.000Z"
    },
    {
      "id": "t2",
      "name": "Стол Carbon S",
      "category": "tables",
      "price_cents": 69900,
      "image_url": "",
      "description": "Композитная столешница, выглядит хай-тек.",
      "created_at": "2025-10-19T12:00:00.000Z"
    }
  ]
}
```

---

### Get Single Product

Retrieve details of a specific product.

**Endpoint:** `GET /api/products/:id`

**Example Request:**
```
GET /api/products/t1
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "t1",
    "name": "Стол Aero X",
    "category": "tables",
    "price_cents": 49900,
    "image_url": "",
    "description": "Минималистичный стол с алюминиевыми вставками.",
    "created_at": "2025-10-19T12:00:00.000Z"
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

### Search Products

Search products by name or description.

**Endpoint:** `GET /api/search?q={query}`

**Query Parameters:**
- `q` (required): Search query string

**Example Request:**
```
GET /api/search?q=стол
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": "t1",
      "name": "Стол Aero X",
      "category": "tables",
      "price_cents": 49900,
      "image_url": "",
      "description": "Минималистичный стол с алюминиевыми вставками.",
      "created_at": "2025-10-19T12:00:00.000Z"
    }
  ]
}
```

---

## Cart

**⚠️ All cart endpoints require authentication. Include JWT token in Authorization header.**

### Get User's Cart

Retrieve current user's shopping cart.

**Endpoint:** `GET /api/cart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "product_id": "t1",
        "quantity": 2,
        "name": "Стол Aero X",
        "category": "tables",
        "price_cents": 49900,
        "image_url": "",
        "description": "Минималистичный стол с алюминиевыми вставками.",
        "line_total_cents": 99800
      }
    ],
    "total_cents": 99800
  }
}
```

---

### Add Item to Cart

Add a product to the cart or update quantity if already exists.

**Endpoint:** `POST /api/cart`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "product_id": "t1",
  "quantity": 1
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": "t1",
    "quantity": 1
  }
}
```

**Validation Rules:**
- `product_id`: Required, must exist in products table
- `quantity`: Required, must be at least 1

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Product not found"
}
```

---

### Update Cart Item Quantity

Update the quantity of an item in the cart.

**Endpoint:** `PUT /api/cart/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": 1,
    "product_id": "t1",
    "quantity": 3
  }
}
```

**Error Response:** `404 Not Found`
```json
{
  "success": false,
  "error": "Cart item not found"
}
```

---

### Remove Item from Cart

Delete an item from the cart.

**Endpoint:** `DELETE /api/cart/:id`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Item removed from cart"
}
```

---

## Orders

**⚠️ All order endpoints require authentication.**

### Create Order

Create a new order from the current cart. This will:
1. Create an order record
2. Copy cart items to order_items
3. Clear the cart

**Endpoint:** `POST /api/orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "order": {
      "id": 1,
      "user_id": 1,
      "total_cents": 99800,
      "status": "pending",
      "created_at": "2025-10-19T12:00:00.000Z",
      "items": [
        {
          "id": 1,
          "product_id": "t1",
          "quantity": 2,
          "price_cents": 49900,
          "name": "Стол Aero X",
          "category": "tables",
          "image_url": "",
          "line_total_cents": 99800
        }
      ]
    }
  }
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": "Cart is empty"
}
```

---

### Get Order History

Retrieve all orders for the authenticated user.

**Endpoint:** `GET /api/orders`

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "total_cents": 99800,
      "status": "pending",
      "created_at": "2025-10-19T12:00:00.000Z",
      "items": [
        {
          "id": 1,
          "product_id": "t1",
          "quantity": 2,
          "price_cents": 49900,
          "name": "Стол Aero X",
          "category": "tables",
          "image_url": "",
          "line_total_cents": 99800
        }
      ]
    }
  ]
}
```

---

## Authentication Flow

### Using JWT Tokens

1. **Register or Login** to receive a JWT token
2. **Store the token** securely (localStorage, sessionStorage, or cookie)
3. **Include token in all authenticated requests:**
   ```
   Authorization: Bearer {token}
   ```

### Token Expiration

- Tokens expire after 7 days (configurable in `.env`)
- When a token expires, API returns `401 Unauthorized`
- Frontend should redirect to login page
- User must login again to get a new token

### Example Usage (JavaScript/Fetch)

```javascript
// Login
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Store token
localStorage.setItem('token', token);

// Use token for authenticated requests
const cartResponse = await fetch('/api/cart', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const cart = await cartResponse.json();
```

---

## Error Handling

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Or for validation errors:

```json
{
  "success": false,
  "errors": [
    {
      "msg": "Email is required",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Products Table
```sql
CREATE TABLE products (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price_cents INTEGER NOT NULL,
    image_url VARCHAR(500),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Cart Table
```sql
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id)
);
```

### Orders Table
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_cents INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Order_items Table
```sql
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price_cents INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Security Features

- **Password Hashing:** bcrypt with 10 salt rounds
- **JWT Authentication:** Secure token-based authentication
- **Input Validation:** express-validator for all user inputs
- **SQL Injection Prevention:** Parameterized queries
- **CORS:** Configured for specific domains only
- **Helmet:** Security headers
- **Environment Variables:** Sensitive data in .env file

---

## Rate Limiting (Recommended)

For production, consider adding rate limiting:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## CORS Configuration

CORS is configured in `server.js` to allow requests from:
- Domains specified in `CORS_ORIGIN` environment variable
- Supports credentials (cookies, authorization headers)

---

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get products
curl http://localhost:3000/api/products

# Get cart (with auth)
curl http://localhost:3000/api/cart \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import the endpoints as a collection
2. Set up environment variables for token and base URL
3. Use {{token}} in Authorization header
4. Save responses to test data flow

---

## Environment Variables

Required environment variables (see `.env.example`):

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `yourstyle_db` |
| `DB_USER` | Database user | `yourstyle_user` |
| `DB_PASSWORD` | Database password | `secure_password` |
| `JWT_SECRET` | JWT signing key | `random_secret_key` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `CORS_ORIGIN` | Allowed origins | `http://yourstyle.space` |
| `PGADMIN_EMAIL` | pgAdmin login email | `admin@yourstyle.space` |
| `PGADMIN_PASSWORD` | pgAdmin password | `admin_password` |

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Start | `npm start` | Start server in production mode |
| Dev | `npm run dev` | Start with nodemon (auto-restart) |
| Migrate | `npm run migrate` | Run database migrations |
| Seed | `npm run seed` | Seed products data |

---

## License

ISC

---

## Support

For setup help, see [SETUP.md](SETUP.md)

---

**Last Updated:** October 2025  
**Version:** 1.0.0
