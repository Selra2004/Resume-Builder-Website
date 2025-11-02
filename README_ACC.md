# ACC - Asiatech Career Connect

A comprehensive career platform designed to connect OJT college students and alumni with job opportunities through intelligent matching and professional tools.

## 🌟 Features

### For Students/Alumni
- **Resume Builder**: Create professional resumes with an intuitive builder
- **AI Job Matching**: Get personalized job recommendations based on skills and preferences
- **Job Applications**: Apply to positions directly through the platform
- **Profile Management**: Maintain detailed academic and professional profiles
- **Course Management**: Select multiple courses and update graduation status

### For Companies
- **Job Posting**: Create and manage job listings
- **Candidate Matching**: Find students that match job requirements
- **Application Management**: Review and manage job applications
- **Company Profiles**: Showcase business and requirements

### For Coordinators
- **Student Management**: Oversee students in designated courses
- **Company Outreach**: Invite companies to join the platform
- **Bridge Communication**: Facilitate connections between students and companies

### For Administrators
- **User Approval**: Manage coordinator, company, and admin account approvals
- **Platform Oversight**: Monitor all platform activities
- **User Management**: View and manage all user types

## 🚀 Tech Stack

### Frontend
- **React** 19.1.1 with TypeScript
- **Tailwind CSS** for responsive design
- **React Router** for navigation
- **Axios** for API communication
- **React Hook Form** for form management
- **Zustand** for state management
- **React Hot Toast** for notifications

### Backend
- **Node.js** 22.20.0 with Express
- **TypeScript** for type safety
- **MySQL** database with mysql2 driver
- **JWT** authentication
- **Nodemailer** for email services
- **BCrypt** for password hashing

## 📦 Installation & Setup

### Prerequisites
- Node.js 22.20.0
- MySQL database
- Gmail app password for email services

### Frontend Setup
1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
VITE_API_URL=http://localhost:5000/api
```

3. Start development server:
```bash
npm run dev
```

### Backend Setup
1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your configuration:
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=acc_database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=raselmadrideomarana@gmail.com
EMAIL_PASS=ddxx kivl klno telq
EMAIL_FROM=ACC Career Connect <raselmadrideomarana@gmail.com>

# OTP Configuration
OTP_EXPIRE_MINUTES=10
```

4. Set up the database:
   - Import `database.sql` into phpMyAdmin
   - This will create all necessary tables and insert initial data

5. Start the server:
```bash
npm run dev
```

### Full Application
To run both frontend and backend:
```bash
npm start
```

## 🎨 Design System

### Color Palette
- **Primary Green**: #16a34a (primary-600)
- **Light Green**: #22c55e (primary-500)
- **Accent Green**: #10b981 (accent-600)
- **Background**: #f9fafb (gray-50)

### Typography
- **Font Family**: Inter
- **Headings**: Bold weights (600-700)
- **Body**: Regular weight (400)

## 👥 User Roles & Access

### User (Students/Alumni)
- **Email Format**: 1-xxxxxx@asiatech.edu.ph
- **Features**: Resume builder, job applications, profile management
- **Registration**: Direct with OTP verification

### Coordinator
- **Email Format**: Standard email format
- **Features**: Student oversight, company invitations
- **Registration**: Requires admin approval after email verification

### Company
- **Email Format**: Standard email format
- **Features**: Job posting, candidate management
- **Registration**: Invitation-based through coordinators, requires admin approval

### Admin
- **Email Format**: Standard email format
- **Features**: Full platform management, user approvals
- **Registration**: Requires approval from existing admin

## 📧 Email System

The platform uses Nodemailer with Gmail for:
- **OTP Verification**: 6-digit codes for account verification
- **Welcome Emails**: Sent after successful verification
- **Invitation Emails**: For company registration
- **Application Notifications**: Job application status updates
- **Job Match Notifications**: AI-generated job recommendations

## 🗄️ Database Schema

Key tables include:
- `users` - Student/alumni accounts
- `coordinators` - Coordinator accounts
- `companies` - Company accounts
- `admins` - Administrator accounts
- `user_profiles` - Detailed student profiles
- `company_profiles` - Company information
- `jobs` - Job listings
- `resumes` - Student resumes
- `job_applications` - Application tracking
- `job_matches` - AI matching results

## 🔐 Security Features

- **Password Requirements**: 8+ chars, uppercase, lowercase, number, special character
- **JWT Authentication**: Secure token-based auth
- **Email Verification**: OTP-based email verification
- **Role-Based Access**: Different permissions per user type
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive data validation

## 🎯 Course Options

Available courses for students:
- Associate in Hotel and Restaurant Management
- Associate in Information Technology
- BS Accountancy
- BS Business Administration Major in Marketing Management
- BS Criminology
- BS Tourism Management
- BS Hospitality Management
- BS Computer Engineering
- BS Computer Science
- BS Information Technology
- BS Information System
- BS Education Major in English
- BS Education Major in Mathematics
- BS Education Major in Social Science

## 🚧 Future Features (AI Matching)

The AI job matching system will analyze:
- Student skills and courses
- Job requirements and qualifications
- Experience level matching
- Location preferences
- Industry alignment

## 📱 Responsive Design

The platform is fully responsive with:
- **Mobile-First Approach**: Optimized for mobile devices
- **Tablet Support**: Enhanced layouts for tablet screens
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Optimized for touch interactions

## 🛠️ Development Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm start           # Start production server
```

## 👨‍💼 Admin System

### Bootstrap Admin Account
A bootstrap admin account is provided to get started:
- **Email**: `admin@acc4.com`
- **Password**: `AdminACC123!@#`
- **Purpose**: Initial setup only - should be replaced with personal accounts

### Admin Registration System
Additional admins must register and be approved:
- **Registration**: Available at `/admin/register`
- **Approval**: New admins require approval from existing admins
- **Security**: Bootstrap account can be deleted by other admins

### Admin Capabilities
- **Approve**: Coordinators, companies, and new admins
- **View**: All users, companies, and job listings (read-only)
- **Manage**: Other admin accounts (can delete bootstrap account)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For support and questions:
- **Email**: raselmadrideomarana@gmail.com
- **Platform**: ACC Career Connect

## 📝 License

This project is proprietary software for Asiatech College.

---

**ACC - Asiatech Career Connect** - Making job finding easier for OJT college students and alumni.
