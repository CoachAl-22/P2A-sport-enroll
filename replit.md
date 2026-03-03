# Power2ADAPT - Athletic Program Management System

## Overview
Power2ADAPT is a comprehensive athletic program management platform featuring web and mobile applications for parents, coaches, and administrators. It facilitates class enrollment, Stripe-integrated payment processing, and program administration. The system supports real-time enrollment tracking, child profile management, and integrated payment workflows, aiming to provide a complete cross-platform solution for sports program management. The mobile apps offer an intuitive interface for on-the-go enrollment management. The project envisions significant market potential by streamlining athletic program operations and enhancing user experience.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript.
- **Routing**: Wouter for lightweight client-side routing with role-based access control.
- **State Management**: TanStack Query (React Query) for server state management, caching, and API synchronization.
- **UI Framework**: Radix UI components with shadcn/ui for an accessible, customizable component library.
- **Styling**: Tailwind CSS with CSS variables for consistent theming and responsive design.
- **Build Tool**: Vite for fast development and optimized production builds.
- **Analytics**: Recharts library for advanced data visualization and reporting.
- **Mobile Application**: React Native using Expo for cross-platform iOS and Android apps with Material Design UI (React Native Paper).

### Backend Architecture
- **Runtime**: Node.js with Express.js for RESTful API endpoints.
- **Database**: PostgreSQL with Drizzle ORM for type-safe operations and schema management, hosted on Neon serverless PostgreSQL.
- **Authentication**: Express sessions with bcrypt for secure password hashing and user authentication.
- **API Structure**: RESTful endpoints organized by feature (auth, classes, enrollments, payments, admin).

### Data Storage Design
- **ORM**: Drizzle ORM for type safety and TypeScript integration.
- **Schema Design**: Comprehensive relational schema supporting users, children, venues, coaches, classes, enrollments, payments, and notifications.
- **Class Programs**: Structured age-based athletic programs (e.g., Foundation, Emerging, Academy, Senior Squad).
- **Database Enums**: Strongly typed enums for athletic programs, enrollment status, payment status, and user roles.
- **Relationships**: Proper foreign key relationships ensuring data integrity.
- **Venues**: Specific Melbourne locations.

### Authentication & Authorization
- **Session Management**: Express-session with secure cookie configuration.
- **Password Security**: bcrypt hashing with salt rounds.
- **Role-Based Access**: Multi-role system (parent, coach, admin) with route-level authorization.
- **User Identification**: Flexible login supporting email, mobile number, or custom user ID.

### Key Features and Implementations
- **Contact Enquiry System**: Comprehensive contact form with dual notification channels (SMS + Email), admin dashboard for enquiry management, status tracking (new, in_progress, contacted, resolved, closed), and support for multiple contact methods (phone, email, video call).
- **Email Notifications**: Resend integration for professional HTML email notifications, including admin enquiry alerts and customer confirmation emails with branded templates.
- **Phone Number Validation**: Australian phone number validation enforced on both frontend and backend, preventing typos and ensuring valid contact information (supports mobile 04XX and landline formats, accepts +61 or 0 prefixes).
- **Application System**: Comprehensive application forms for premium programs (e.g., Senior Squad, High Performance Squad) with database integration, SMS confirmations, and admin review workflows.
- **Payment & Billing**: Complete Stripe integration for payment processing, including dynamic payment intent generation, comprehensive checkout flow, database payment tracking, term-based pricing, and SMS confirmations.
- **SMS Notifications**: Twilio integration for automated SMS confirmations (enrollment, payment), class reminders, waitlist alerts, and term renewal reminders.
- **Holiday Management**: System to manage holidays, automatically adjusting pricing and teaching week calculations.
- **Class and Staff Management**: Admin interfaces for CRUD operations on classes and staff, with role-based access control.
- **Chat Widget**: Floating chat widget for class recommendations, gathering user preferences and providing tailored suggestions.
- **Education Hub**: Rebranded "Blog" section to "Education Hub" with integration for the Skool community.
- **Video Highlights with Skool Integration**: Complete performance video management system with one-click sharing to Skool community platform, shareable public links, and view tracking.
- **URL Routing**: Proper browser URL routing implemented for all pages, enabling direct link sharing with clean paths (e.g., power2adapt.online/education).
- **Student Survey (Check-In)**: Track & Field / Running Improvement survey with 18 questions, saved to database and automatically synced to Google Sheets via Replit Google Sheets integration.
- **UI/UX Refinements**: Parent-friendly messaging, simplified navigation, enhanced enrollment flows, and improved error handling.

## External Dependencies

### Payment Processing
- **Stripe**: Full payment processing, React Stripe.js components, Payment Intent API, and webhook support.

### Database Services
- **Neon Database**: Serverless PostgreSQL with connection pooling and WebSocket support.
- **Drizzle Kit**: For database schema migrations and version control.

### Development Tools
- **Replit**: Development environment optimization (with Cartographer plugin).
- **TypeScript**: Comprehensive type safety across the application.
- **React Hook Form with Zod**: For robust client-side form validation.

### UI/UX Libraries
- **Radix UI**: Primitive component collection for accessibility compliance.
- **Lucide React**: For consistent iconography.
- **Class Variance Authority & clsx**: For component variants and conditional styling.

### Communication
- **Twilio**: For SMS notification services.
- **Resend**: For professional email notifications with HTML templates.

### Data Sync
- **Google Sheets**: Replit integration for automatically syncing survey responses to a Google Spreadsheet.