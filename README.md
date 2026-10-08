# Saraha App

Node.js + Express + MongoDB (Mongoose) anonymous-messaging app.

## Run
```bash
npm install
cp .env.example .env   # then fill in the values
npm run dev
```

## Structure
```
index.js
src/
  Common/      enums + custom error classes
  DB/          connection, Models, Repositories (repository pattern)
  Middleware/  authentication, authorization, validation
  Modules/     User, Messages (controller + services)
  Utils/       tokens (JWT), encryption, send-email
  Validators/  Joi schemas
docs/          notes for each task (01 → 12)
```

## Endpoints
`/api/users`: `register`, `Confirm`, `login`, `refresh-token`, `Logout`, `signup-gmail`, `update`, `update-password`, `delete`, `list` (admin)
`/api/messages`: `send/:receiverId`, `/`
