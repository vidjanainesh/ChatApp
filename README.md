# 💬 ChatApp

A full-featured real-time chat application with private & group messaging, friend management, message reactions, and more — built using **React**, **Node.js**, **Express**, **Socket.IO**, and **MySQL**.

🌐 **Live Demo**: [ChatApp on Render](https://chatapp-frontend-llqt.onrender.com)

---

## ✨ Features

### 🔐 Authentication
- Register & Login
- Google OAuth login
- Forgot Password & Reset via email token

### 👥 Friend System
- Send, accept, reject friend requests
- View pending requests
- Unfriend existing friends

### 💬 Private Chats
- Real-time messaging with Socket.IO
- Edit & delete messages
- Emoji reactions (❤️ 👍 😂 etc.) with tooltips
- Typing indicators
- Unread message tracking

### 👨‍👩‍👧‍👦 Group Chats
- Create groups with selected friends
- Real-time group messaging
- Edit & delete group messages
- Emoji reactions in group chats
- Typing indicators
- Unread group message tracking
- Leave group
- Invite more friends to existing groups

### 🖥️ UI & UX
- Fully responsive
- Tailwind CSS for styling
- Framer Motion animations
- Toast notifications

### ⚡ Real-Time
- All chats, edits, deletes, reactions update instantly with Socket.IO

### 🚀 Deployment
- Hosted on Render (frontend & backend)

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
DB=development
BASE_URL='http://localhost:3000'

DEV_USERNAME=YOUR_DB_USERNAME
DEV_PASSWORD=YOUR_DB_PASSWORD
DEV_DATABASE=chatapp
DEV_HOST=localhost
DEV_DIALECT=postgres

JWT_SECRET=YOUR_SECRET_KEY

EMAIL=YOUR_EMAIL
EMAIL_PASS=YOUR_EMAIL_APP_PASSWORD

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