# Blog API

A complete RESTful API for a blog application with authentication, posts, comments, notifications, likes, and user management.

## 🚀 Features

- **Authentication** with Supabase JWT tokens
- **Posts Management** (CRUD operations)
- **Comments System** with user info
- **Notifications** for comments and likes
- **Like System** with toggle functionality
- **User Roles** (admin/user management)
- **Categories** for post organization
- **Database** integration with PostgreSQL

## 📡 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### Posts
- `GET /posts/published` - Get published posts
- `GET /posts/{id}` - Get specific post
- `POST /posts` - Create post (admin only)
- `PUT /posts/{id}` - Update post (admin only)
- `DELETE /posts/{id}` - Delete post (admin only)

### Comments
- `GET /comments/post/{postId}` - Get comments for a post
- `POST /comments` - Create comment
- `DELETE /comments/{commentId}` - Delete comment

### Notifications
- `GET /notifications` - Get notifications (with optional recipient_id filter)
- `POST /notifications` - Create notification
- `PATCH /notifications/{id}/read` - Mark notification as read
- `PATCH /notifications/read-all` - Mark all notifications as read

### Likes
- `GET /likes/posts/{postId}/likes/count` - Get like count
- `GET /likes/posts/{postId}/likes/user/{userId}` - Check if user liked post
- `POST /likes/posts/{postId}/likes` - Toggle like/unlike post

### Users
- `GET /users/{userId}/role` - Get user role
- `GET /me` - Get current user info

### Categories
- `GET /categories` - Get all categories

### Admin
- `GET /admin/users` - User management (admin only)

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Supabase project

### Setup
```bash
# Clone repository
git clone https://github.com/PaanPatiPhi/blog-api.git
cd blog-api

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Variables
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# Database Configuration
DATABASE_URL=postgresql://user:password@host:port/database

# Server Configuration
PORT=4002
```

## 🚀 Running

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Build for Deployment
```bash
npm run build
```

## 📡 API Usage Examples

### Authentication
```bash
# Login
curl -X POST http://localhost:4002/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'
```

### Get Posts
```bash
curl http://localhost:4002/posts/published
```

### Create Comment
```bash
curl -X POST http://localhost:4002/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "post_id": 1,
    "user_id": "user-uuid",
    "comment_text": "Great article!"
  }'
```

### Create Notification
```bash
curl -X POST http://localhost:4002/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "recipient_id": "user-uuid",
    "sender_id": "sender-uuid",
    "type": "comment",
    "comment_id": 123
  }'
```

### Like Post
```bash
curl -X POST http://localhost:4002/likes/posts/1/likes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"user_id": "user-uuid"}'
```

## 🔐 Authentication

This API uses Supabase JWT authentication:

### Getting Token
```javascript
// Login with Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});

const token = data.session.access_token;
```

### Using Token
```bash
# Include in Authorization header
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:4002/protected-endpoint
```

## 📊 Database Schema

### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(255),
  profile_pic TEXT,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Posts
```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  image TEXT,
  category_id INTEGER REFERENCES categories(id),
  status_id INTEGER DEFAULT 2,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Comments
```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Notifications
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_id UUID REFERENCES users(id),
  sender_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  related_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);
```

### Likes
```sql
CREATE TABLE likes (
  post_id INTEGER REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id)
);
```

## 🚀 Deployment

### Vercel Deployment
1. **Set Environment Variables** in Vercel Dashboard
2. **Push to GitHub**
3. **Connect Vercel to GitHub**
4. **Deploy automatically**

See [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed instructions.

### Environment Variables for Vercel
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `DATABASE_URL`

## 🔧 Development

### Project Structure
```
blog-api/
├── middlewares/          # Authentication and validation
├── routes/              # API endpoints
├── utils/               # Database connection
├── app.mjs             # Main application
├── server.mjs           # Server entry point
├── package.json         # Dependencies
└── .env                 # Environment variables
```

### Adding New Endpoints
1. Create route file in `routes/`
2. Import and use in `app.mjs`
3. Add authentication middleware if needed
4. Test with curl or Postman

## 🐛 Debugging

### Debug Endpoints
- `GET /debug/env` - Check environment variables
- `POST /debug/decode` - Decode JWT tokens
- `GET /debug/jwks` - Test JWKS endpoint
- `GET /test/auth` - Test authentication
- `GET /test/admin` - Test admin access

### Common Issues
1. **401 Unauthorized** - Check token and environment variables
2. **403 Forbidden** - Check user role
3. **Database errors** - Check DATABASE_URL
4. **CORS errors** - Check origin configuration

## 📝 API Response Format

### Success Response
```json
{
  "data": [...],
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "error": "Error description",
  "details": "Additional error details"
}
```

## 🔒 Security

### Authentication
- JWT token validation
- Admin role protection
- Input sanitization
- SQL injection prevention

### CORS
- Configured for specific origins
- Production-ready origins

### Rate Limiting
- Recommended for production
- Use express-rate-limit

## 📚 Documentation

- [SUPABASE_AUTH_GUIDE.md](./SUPABASE_AUTH_GUIDE.md) - Authentication setup
- [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) - Deployment guide

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

## 📄 License

ISC License

## 🆘 Support

For issues and support:
- Create GitHub issue
- Check documentation
- Review debug endpoints

---

**Built with ❤️ using Node.js, Express, PostgreSQL, and Supabase**
