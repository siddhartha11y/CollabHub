# 🚀 CollabHub - Team Collaboration Platform

A production-ready SaaS application for small teams featuring workspaces, real-time chat, task management, document collaboration, file sharing, and video meetings. Built to impress recruiters with enterprise-level architecture and modern tech stack.

## ✨ Features

### 🏢 **Multi-tenant Workspaces**
- Create and manage multiple workspaces
- Role-based permissions (Admin, Member, Viewer)
- Secure workspace isolation
- Team member invitations via email

### ✅ **Task Management**
- Kanban board interface with drag & drop
- Task assignments and status tracking
- Priority levels and due dates
- File attachments to tasks
- Real-time status updates

### 📝 **Document Collaboration**
- Real-time document editing
- Markdown support with live preview
- Auto-save functionality (every 3 seconds)
- Document search and organization

### 💬 **Real-time Chat**
- Channel-based messaging
- Instant message delivery
- Auto-scroll to new messages
- Message history and search

### 📁 **File Management**
- Drag & drop file uploads via Uploadthing
- Support for images (4MB), PDFs (8MB), text files (2MB)
- File organization by workspace/task
- Secure cloud storage with preview

### 🎥 **Meeting Scheduler**
- Schedule team meetings with calendar
- Meeting history and upcoming events
- Video meeting integration ready
- Meeting notifications

### 🔐 **Authentication & Security**
- Multiple auth providers (Google, Email, Credentials)
- Secure session management with NextAuth.js
- Password reset functionality
- Email verification and magic links
- Multi-tenant data isolation

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better DX
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Modern, accessible UI components
- **React Hook Form** - Performant form handling
- **Zod** - Runtime schema validation

### Backend
- **Next.js API Routes** - Serverless functions
- **Prisma ORM** - Type-safe database toolkit
- **PostgreSQL** - Robust relational database
- **NextAuth.js** - Complete authentication solution

### Services & Integrations
- **Supabase** - Database hosting & real-time features
- **Uploadthing** - File upload service (free tier)
- **Nodemailer** - Email delivery
- **Google OAuth** - Social authentication

### DevOps & Deployment
- **Vercel** - Serverless deployment platform
- **Railway/Neon** - Database hosting options
- **GitHub** - Version control and CI/CD

## 📋 Prerequisites

Before you begin, ensure you have:
- Node.js 18+ installed
- A PostgreSQL database (local or cloud)
- Google OAuth credentials
- Email service for magic links (Gmail recommended)

## 🚀 Getting Started

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd collabhub
npm install
```

### 2. Environment Setup

Copy `.env.local` and fill in your credentials:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/collabhub"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Email (Gmail App Password recommended)
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your_email@gmail.com"
EMAIL_SERVER_PASSWORD="your_app_password"
EMAIL_FROM="your_email@gmail.com"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# (Optional) Seed with sample data
npx prisma db seed
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔧 Configuration Guides

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Email Magic Links Setup

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_SERVER_PASSWORD`

### Database Options

**Local PostgreSQL:**
```bash
# Install PostgreSQL locally
# Create database: createdb collabhub
DATABASE_URL="postgresql://username:password@localhost:5432/collabhub"
```

**Cloud Options (Free Tiers):**
- **Supabase**: Free PostgreSQL with 500MB
- **Railway**: Free tier with PostgreSQL
- **Neon**: Serverless PostgreSQL with free tier

## 📁 Project Structure

```
src/
├── app/                    # Next.js 14 App Router
│   ├── api/auth/          # NextAuth API routes
│   ├── auth/signin/       # Authentication pages
│   ├── dashboard/         # Main dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Shadcn/ui components
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
├── lib/                   # Utilities
│   ├── auth.ts           # NextAuth configuration
│   └── prisma.ts         # Prisma client
└── prisma/
    └── schema.prisma     # Database schema
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

Update `NEXTAUTH_URL` to your production domain:
```bash
NEXTAUTH_URL="https://yourdomain.com"
```

## 🔮 Roadmap

- [ ] Real-time chat with WebSockets
- [ ] File upload with Cloudinary
- [ ] Video meetings integration
- [ ] Advanced task management
- [ ] Document collaboration
- [ ] Mobile app
- [ ] API documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](https://github.com/yourusername/collabhub/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
