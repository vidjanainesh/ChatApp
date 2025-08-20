# 💬 ChatApp

A full-featured real-time chat application with private & group messaging, friend management, message reactions, and more — built using **React**, **Node.js**, **Express**, **Socket.IO**, and **MySQL**.

🌐 **Live Demo**: <a href="https://chatapp-frontend-llqt.onrender.com" target="_blank">ChatApp on Render</a>

---

## ✨ Features

### 🔐 Authentication

-   Register & Login
-   Google OAuth login
-   Forgot Password & Reset via email token

### 👥 Friend System

-   Send, accept, reject friend requests
-   View pending requests
-   Unfriend existing friends

### 💬 Private Chats

-   Real-time messaging with Socket.IO
-   Edit & delete messages
-   Emoji reactions (❤️ 👍 😂 etc.) with tooltips
-   Typing indicators
-   Unread message tracking

### 👨‍👩‍👧‍👦 Group Chats

-   Create groups with selected friends
-   **Group Roles:** Super Admin, Admin features
-   Real-time group messaging
-   Edit & delete group messages
-   Emoji reactions in group chats
-   Typing indicators
-   Unread group message tracking
-   Leave group
-   Admins can invite more people or remove members

### 🖼️ Profile & Media

-   View and edit profile (avatar, username, etc.)
-   Upload images (Cloudinary integrated)

### 📱 WhatsApp Notifications

-   Nudging or notifying via WhatsApp (free/test number integration)

### 🖥️ UI & UX

-   Fully responsive
-   Tailwind CSS for styling
-   Framer Motion animations
-   Toast notifications

### 🔒 Security

-   Messages are securely encrypted before storage and decrypted when retrieved, ensuring privacy and data protection.
-   User passwords are hashed using **bcrypt** before being stored in the database to safeguard user credentials.

### ⚡ Real-Time

-   All chats, edits, deletes, reactions, online status updates instantly with Socket.IO

### 🚀 Deployment

-   Hosted on Render (frontend & backend)

---

## 🛠️ Tech Stack

**Frontend:**

-   React
-   Tailwind CSS
-   Framer Motion
-   React Router
-   Axios
-   Toastify

**Backend:**

-   Node.js
-   Express.js
-   Sequelize ORM (MySQL)
-   Socket.IO
-   JWT (Authentication)
-   Google Identity OAuth

**Database:**

-   PostgreSQL

**Deployment:**

-   Render (both frontend and backend)

## 🚀 Getting Started

```bash
# clone the repositories
git clone https://github.com/vidjanainesh/ChatApp.git

# setup backend
cd backend
npm install

# create .env file for backend
PORT=3000
DB=development
BASE_URL='http://localhost:3000'

DEV_USERNAME=YOUR_DB_USERNAME
DEV_PASSWORD=YOUR_DB_PASSWORD
DEV_DATABASE=chatapp
DEV_HOST=localhost
DEV_DIALECT=postgres

JWT_SECRET=YOUR_SECRET_KEY

ENCRYPTION_KEY=YOUR_ENCRYPTION_KEY

EMAIL=YOUR_EMAIL
EMAIL_PASS=YOUR_EMAIL_APP_PASSWORD

CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
CLOUDINARY_API_KEY=YOUR_CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET=YOUR_CLOUDINARY_API_SECRET

WHATSAPP_TOKEN=YOUR_WHATSAPP_TOKEN
WHATSAPP_PHONENO_ID=YOUR_WHATSAPP_PHONENO_ID
WHATSAPP_URL='https://graph.facebook.com/v23.0/YOUR_WHATSAPP_PHONENO_ID/messages'

# Create the database in PostgreSQL:
CREATE DATABASE chatapp;

# Run migrations (if using Sequelize CLI):
npx sequelize db:migrate

# start backend
npm start

# setup frontend
cd frontend
npm install

# create .env file for frontend
REACT_APP_API_BASE='http://localhost:3000'
REACT_APP_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID

npm start
```
