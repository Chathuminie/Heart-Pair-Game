# HeartPair Development Guide

## Getting Started

### Prerequisites
- Node.js (v14+)
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd HeartPair
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Setup environment**
   Create `.env` in `backend/` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/heartpair
   PORT=5000
   JWT_SECRET=your-secret-key-change-in-production
   NODE_ENV=development
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```
   Server runs on `http://localhost:5000`

5. **Open in browser**
   Navigate to `http://localhost:5000`

---

## Project Structure Quick Reference

### Frontend (`/frontend`)
```
js/
  api.js          ← Use this for ALL API calls
  auth.js         ← Use this for authentication
  game.js         ← Main game logic

css/
  style.css       ← Auth pages styling
  game.css        ← Game page styling

*.html            ← Page templates
images/           ← Heart images (heart1.png, etc.)
```

### Backend (`/backend`)
```
controllers/      ← Handle HTTP requests
middleware/       ← JWT verification
models/           ← MongoDB schemas
routes/           ← API routes
services/         ← Business logic
utils/            ← Helpers & constants
server.js         ← Express app setup
```

---

## Adding Features

### Add a New Game Level

1. **Update `frontend/js/game.js` (LEVELS configuration)**
   ```javascript
   const LEVELS = {
     easy: { time: 90, lives: 15, pairs: 3 },
     medium: { time: 60, lives: 10, pairs: 6 },
     hard: { time: 30, lives: 10, pairs: 8 },
     insane: { time: 15, lives: 5, pairs: 10 }  // ← NEW
   };
   ```

2. **Add HTML button in `frontend/game.html`**
   ```html
   <div class="level-card">
     <div class="level-name">INSANE</div>
     <button class="play-btn">Play</button>
   </div>
   ```

3. **Test the level in browser**

### Add a New API Endpoint

1. **Create route in `backend/routes/newRoutes.js`**
   ```javascript
   const router = require('express').Router();
   const controller = require('../controllers/newController');
   const auth = require('../middleware/auth');
   
   router.post('/', auth, controller.create);  // Protected
   router.get('/', controller.list);           // Public
   
   module.exports = router;
   ```

2. **Create controller `backend/controllers/newController.js`**
   ```javascript
   const { sendError, sendSuccess } = require('../utils/errorHandler');
   const { ERRORS, SUCCESS } = require('../utils/constants');
   
   exports.create = async (req, res) => {
     try {
       // Your logic here
       return sendSuccess(res, 201, SUCCESS.MESSAGE, data);
     } catch (err) {
       return sendError(res, 500, ERRORS.DB_ERROR, err);
     }
   };
   ```

3. **Register route in `backend/server.js`**
   ```javascript
   app.use("/api/new", require("./routes/newRoutes"));
   ```

### Add Frontend API Call

1. **Add to `frontend/js/api.js`**
   ```javascript
   export const NewAPI = {
     getData: () =>
       apiCall('/new', { method: 'GET' }),
     
     saveData: (payload) =>
       apiCall('/new', {
         method: 'POST',
         body: JSON.stringify(payload),
       }),
   };
   ```

2. **Use in `frontend/js/game.js`**
   ```javascript
   import { NewAPI } from './api.js';
   
   const data = await NewAPI.getData();
   ```

---

## Code Style Guide

### Frontend JavaScript
```javascript
// ✅ DO: Clear, descriptive names
function updateAccountDisplay() {
  DOM['account-info'].innerHTML = `...`;
}

// ❌ DON'T: Vague names
function update() {
  document.getElementById('ai').innerHTML = `...`;
}

// ✅ DO: Use constants
const LEVELS = { easy: {...}, medium: {...} };

// ❌ DON'T: Magic values
if (pairCount === 3 || pairCount === 6) { ... }
```

### Backend JavaScript
```javascript
// ✅ DO: Use error handler
sendError(res, 400, ERRORS.INVALID_CREDENTIALS, err);

// ❌ DON'T: Mix error formats
res.status(400).json({ error: 'Invalid' });

// ✅ DO: Validate input early
if (!email || !password) {
  return sendError(res, 400, 'Email and password required');
}

// ❌ DON'T: Assume valid data
const user = await User.findOne({ email });
```

---

## Common Tasks

### Check Server Logs
```bash
# Terminal will show:
# - Connection status
# - Errors
# - Request logs (if morgan installed)
```

### Debug Frontend
```javascript
// Open DevTools (F12)
// Check Console tab for errors
// Check Network tab for API calls
```

### Debug Backend
```bash
# Add console.log statements
console.log('Request received:', req.body);

# Check server terminal output
# Server will show errors and logs
```

### Test API Endpoints
```bash
# Using curl
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"pass"}'

# Using Postman
# 1. Create new request
# 2. Set method and URL
# 3. Add body (JSON)
# 4. Send
```

### Connect to MongoDB

**Local MongoDB:**
```bash
# Start MongoDB service
mongod

# In .env
MONGODB_URI=mongodb://localhost:27017/heartpair
```

**MongoDB Atlas (Cloud):**
```bash
# Create cluster at atlas.mongodb.com
# In .env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/heartpair?retryWrites=true&w=majority
```

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### 401 Unauthorized errors
```javascript
// Problem: JWT cookie not being sent
// Solution: Check that API calls use credentials: 'include'
// This is handled in api.js - check it's imported
```

### Port already in use
```bash
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process
taskkill /PID <PID> /F

# Or change port in .env
PORT=5001
```

### MongoDB connection fails
```bash
# Check MongoDB is running
# Check connection string in .env
# Check network access (if using Atlas)
# Check credentials are correct
```

### Game not saving scores
```javascript
// Check:
// 1. User is authenticated (check cookies in DevTools)
// 2. Backend received the request (check server logs)
// 3. MongoDB is accepting writes (check MongoDB logs)
// 4. API response is successful (check Network tab in DevTools)
```

---

## Best Practices

### 1. Always Use Error Handler
```javascript
// ✅ Good
const { sendError, sendSuccess } = require('../utils/errorHandler');
sendError(res, 400, ERRORS.INVALID_INPUT);

// ❌ Bad
res.status(400).json({ error: 'Invalid input' });
```

### 2. Validate Input Early
```javascript
// ✅ Good
if (!email || !password) {
  return sendError(res, 400, 'Email and password required');
}

// ❌ Bad
const user = await User.findOne({ email }); // May fail if email is null
```

### 3. Use Constants
```javascript
// ✅ Good
return sendSuccess(res, 201, SUCCESS.REGISTERED, { userId });

// ❌ Bad
return res.status(201).json({ message: 'User registered', userId });
```

### 4. Keep Controllers Thin
```javascript
// ✅ Good
async function login(req, res) {
  const data = await authService.login(req.body);
  sendSuccess(res, 200, SUCCESS.LOGIN, data);
}

// ❌ Bad (Business logic in controller)
async function login(req, res) {
  const user = await User.findOne({ email: req.body.email });
  const valid = await bcrypt.compare(req.body.password, user.password);
  // ... lots more code
}
```

### 5. Use Async/Await
```javascript
// ✅ Good
async function getUser(id) {
  const user = await User.findById(id);
  return user;
}

// ❌ Bad (Callback hell)
function getUser(id, callback) {
  User.findById(id, function(err, user) {
    if (err) callback(err);
    else callback(null, user);
  });
}
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Update `.env` with production values
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (set `secure: true` in JWT cookie)
- [ ] Remove debug `console.log()` statements
- [ ] Test all features in production-like environment
- [ ] Setup MongoDB backups
- [ ] Setup error monitoring (e.g., Sentry)
- [ ] Setup performance monitoring
- [ ] Create database indexes
- [ ] Test authentication thoroughly
- [ ] Test score saving thoroughly
- [ ] Load test with multiple users

---

## Contributing Guidelines

1. **Create feature branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make changes following code style**

3. **Test thoroughly**
   ```bash
   # Manual testing in browser
   # Check console for errors
   # Check network requests
   ```

4. **Commit with clear message**
   ```bash
   git commit -m "Add new feature description"
   ```

5. **Push and create pull request**
   ```bash
   git push origin feature/new-feature
   ```

---

## Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [MDN Web Docs](https://developer.mozilla.org/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## Questions?

- Check existing documentation (README.md, ARCHITECTURE.md)
- Search project for similar implementations
- Check browser console and server logs
- Create an issue with detailed description

Happy coding! 🚀
