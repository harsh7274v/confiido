# Lumina Backend API

A comprehensive Node.js/Express backend for the Lumina expert consultation platform, built with TypeScript, MongoDB, and modern development practices.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Complete user profile management with preferences
- **Expert Profiles**: Comprehensive expert profile system with verification
- **Booking System**: Advanced booking management with conflict detection
- **Payment Integration**: Stripe payment processing (ready for implementation)
- **Real-time Features**: Socket.io integration for messaging and notifications
- **File Upload**: Cloudinary integration for media uploads
- **Email Notifications**: Nodemailer integration for email communications
- **Security**: Helmet, CORS, rate limiting, and input validation
- **Error Handling**: Centralized error handling with detailed logging

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud)
- npm or yarn

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/lumina
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Expert Endpoints

#### Get All Experts
```http
GET /api/experts?page=1&limit=10&expertise=marketing&rating=4&priceMin=50&priceMax=200
```

#### Get Expert by ID
```http
GET /api/experts/:id
```

#### Create Expert Profile
```http
POST /api/experts
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Marketing Consultant",
  "company": "Marketing Pro Inc",
  "expertise": ["Digital Marketing", "SEO", "Content Strategy"],
  "description": "Experienced marketing consultant with 10+ years in digital marketing...",
  "hourlyRate": 150,
  "languages": ["English", "Spanish"],
  "sessionTypes": [
    {
      "type": "video",
      "duration": 60,
      "price": 150,
      "description": "Video consultation session"
    }
  ]
}
```

### Booking Endpoints

#### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "expertId": "expert_id_here",
  "sessionType": "video",
  "duration": 60,
  "scheduledDate": "2024-01-15T10:00:00.000Z",
  "startTime": "10:00",
  "notes": "I'd like to discuss marketing strategy"
}
```

#### Get User Bookings
```http
GET /api/bookings?status=confirmed&page=1&limit=10
Authorization: Bearer <token>
```

### User Profile Endpoints

#### Update Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Marketing professional with 5 years experience",
  "location": {
    "country": "United States",
    "city": "New York"
  }
}
```

## 🗄️ Database Models

### User Model
- Basic profile information
- Authentication details
- Preferences and settings
- Social links
- Privacy settings

### Expert Model
- Professional information
- Expertise areas
- Availability schedule
- Session types and pricing
- Education and experience
- Verification status

### Booking Model
- Session details
- Scheduling information
- Payment status
- Cancellation handling

## 🔧 Development

### Project Structure
```
src/
├── config/          # Configuration files
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── utils/           # Utility functions
└── index.ts         # Main server file
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run lint         # Lint code
npm run lint:fix     # Fix linting issues
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment | development |
| `MONGODB_URI` | MongoDB connection string | mongodb://localhost:27017/lumina |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: express-validator for request validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Configured for frontend communication
- **Helmet**: Security headers
- **Error Handling**: Centralized error management

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret
4. Configure CORS for production domain
5. Set up environment variables

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 📝 TODO

- [ ] Implement message system with Socket.io
- [ ] Add review and rating system
- [ ] Complete Stripe payment integration
- [ ] Add email notification system
- [ ] Implement file upload with Cloudinary
- [ ] Add admin dashboard routes
- [ ] Implement search and filtering
- [ ] Add automated testing
- [ ] Add API documentation with Swagger

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@lumina.com or create an issue in the repository. 