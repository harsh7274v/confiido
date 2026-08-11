# Confiido

**Confiido** is a full-stack career mentorship platform that enables users to discover mentors, book mentorship sessions, make secure payments, communicate in real time, and manage scheduled meetings.

The platform is built as a monorepo with a **Next.js frontend** and **Express + TypeScript backend**, with role-based access control, authentication, payment processing, notifications, scheduling, and real-time communication.

## 🚀 Key Features

### 🔐 Authentication & Authorization

* Built a unified **Login / Sign Up interface using Next.js Accordion UI**, allowing users to switch seamlessly between authentication flows.
* Implemented **email-based authentication with SMTP** for account verification and email notifications.
* Integrated **Firebase Authentication** for Google OAuth login.
* Implemented **JWT-based authentication** for securing backend APIs.
* Developed **Role-Based Access Control (RBAC)** with separate permissions and workflows for **Users and Admins**.

### 👤 User Dashboard

* Developed a personalized dashboard available after successful authentication.
* Users can manage:

  * Mentor bookings
  * Upcoming and completed sessions
  * Rewards
  * Reviews
  * Profile information
  * Meeting schedules
  * Payment history

### 👨‍🏫 Mentor Discovery & Booking

* Built mentor discovery and availability management functionality.
* Users can view available mentor schedules and book mentorship sessions.
* Implemented booking validation to prevent conflicts and invalid time-slot selections.
* Added functionality for users to **reschedule previously booked meetings** based on mentor availability.

### 💳 Payment Integration

* Integrated **Razorpay** for secure online payments.
* Implemented payment verification and transaction handling on the backend.
* Booking confirmation is triggered only after successful payment verification.
* Maintained booking and payment states to ensure consistency between transactions and scheduled sessions.

### 📅 Automated Meeting & Notifications

* After successful payment and booking confirmation:

  * A **meeting link is generated/sent to the user**.
  * The **mentor receives the meeting details**.
  * Email notifications are sent through SMTP.
* Integrated **Google Calendar** functionality for managing scheduled mentorship sessions.
* Implemented email/OTP-based notification workflows.

### 🎁 Rewards System

* Developed a user **reward system** to encourage engagement on the platform.
* Users can earn rewards based on eligible platform activities.
* Reward information is integrated into the user dashboard.

### 💬 Real-Time Communication

* Implemented **Socket.IO** for real-time messaging between users and mentors.
* Supports live communication without requiring page refreshes.
* Real-time booking/session updates are synchronized between connected users.

### ☁️ File & Media Management

* Integrated **Cloudinary** for secure file and image uploads.
* Used cloud-based storage instead of storing media directly on the application server.

---

## 🏗️ Project Architecture

The project follows a **monorepo architecture**:

```text
Confiido/
│
├── frontend/
│   ├── Next.js
│   ├── React
│   ├── TypeScript
│   └── UI Components
│
├── backend/
│   ├── Express.js
│   ├── TypeScript
│   ├── MongoDB
│   ├── REST APIs
│   ├── Authentication
│   ├── RBAC
│   ├── Payment Services
│   └── Background Services
│
└── backend/api/
    └── Serverless/API deployment variants
```

### Technology Stack

**Frontend**

* Next.js
* React
* TypeScript
* CSS/Tailwind CSS

**Backend**

* Node.js
* Express.js
* TypeScript
* REST APIs
* Socket.IO

**Database**

* MongoDB

**Authentication & Security**

* JWT
* Firebase Authentication
* Google OAuth
* RBAC
* SMTP

**Payments**

* Razorpay

**Cloud & Integrations**

* Cloudinary
* Google Calendar
* Firebase
* Vercel

---

## ⚙️ Application Flow

```text
User
 │
 ▼
Login / Sign Up
 │
 ├── Email + SMTP
 │
 └── Google Authentication
       │
       ▼
   Authentication
       │
       ▼
    RBAC Check
       │
   ┌───┴────┐
   ▼        ▼
 User      Admin
   │
   ▼
Dashboard
   │
   ▼
Discover Mentor
   │
   ▼
Select Available Slot
   │
   ▼
Razorpay Payment
   │
   ▼
Payment Verification
   │
   ▼
Booking Confirmation
   │
   ├──► Meeting Link → User
   │
   ├──► Meeting Details → Mentor
   │
   ├──► Email Notification
   │
   └──► Google Calendar
```

---

## 🔑 Core Backend Responsibilities

The Express backend provides REST APIs for:

* Authentication and authorization
* User and mentor management
* Role-based access control
* Mentor availability
* Booking creation and management
* Meeting rescheduling
* Payment processing and verification
* Reward management
* Reviews and ratings
* Notifications and OTPs
* Real-time communication
* File uploads
* Dashboard analytics

The frontend communicates with the backend through the configured API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:5003
```

---

## 🛠️ Local Setup

### Prerequisites

* Node.js 18+
* npm 9+
* MongoDB
* Firebase project
* Razorpay account
* SMTP credentials
* Cloudinary account
* Google Calendar API credentials

### Install Dependencies

```bash
git clone <repository-url>

cd Confiido

cd backend
npm install

cd ../frontend
npm install
```

### Environment Variables

Create `.env` inside `backend/`:

```env
PORT=5003
MONGODB_URI=
JWT_SECRET=
FRONTEND_URL=

FIREBASE_=
EMAIL_=
SMTP_=
RAZORPAY_=
CLOUDINARY_=
GOOGLE_=
```

Create `.env.local` inside `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5003

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

In another terminal:

```bash
cd frontend
npm run dev
```

The application will be available at:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:5003
```

---

## 📌 Engineering Highlights

* Implemented **role-based authorization** for User and Admin workflows.
* Integrated multiple authentication mechanisms including **JWT, Firebase Google Authentication, and SMTP-based email workflows**.
* Built a complete **mentor booking → payment → meeting confirmation** workflow.
* Integrated **Razorpay payment verification** before confirming bookings.
* Implemented **meeting rescheduling** with mentor availability validation.
* Added **real-time communication using Socket.IO**.
* Automated meeting notifications and meeting-link delivery to both users and mentors.
* Implemented a **reward system** to improve user engagement.
* Integrated third-party services including **Firebase, Razorpay, Cloudinary, SMTP, and Google Calendar**.
* Structured the application as a scalable **Next.js + Express TypeScript monorepo**.

## 📄 License

MIT
