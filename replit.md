# Power2ADAPT - Athletic Program Management System

## Overview

Power2ADAPT is a comprehensive web application designed for managing athletic programs, classes, and enrollments. The system serves multiple user types including parents, coaches, and administrators, providing features for class enrollment, payment processing via Stripe, and program administration. Built as a full-stack application with a React frontend and Express backend, it offers a complete solution for sports program management with real-time enrollment tracking, child profile management, and integrated payment workflows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **Routing**: Wouter for lightweight client-side routing with role-based access control
- **State Management**: TanStack Query (React Query) for server state management, caching, and API synchronization
- **UI Framework**: Radix UI components with shadcn/ui for accessible, customizable component library
- **Styling**: Tailwind CSS with CSS variables for consistent theming and responsive design
- **Build Tool**: Vite for fast development and optimized production builds
- **Analytics**: Recharts library for advanced data visualization and reporting charts

### Backend Architecture
- **Runtime**: Node.js with Express.js providing RESTful API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations and schema management
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud database hosting
- **Authentication**: Express sessions with bcrypt for secure password hashing and user authentication
- **API Structure**: RESTful endpoints organized by feature (auth, classes, enrollments, payments, admin)

### Data Storage Design
- **ORM**: Drizzle ORM chosen for type safety, performance, and excellent TypeScript integration
- **Schema Design**: Comprehensive relational schema supporting users, children, venues, coaches, classes, enrollments, payments, and notifications
- **Class Programs**: Structured age-based athletic programs (Foundation Prep-Year 2, Emerging Year 3-6, Academy Year 7+, Team Sport Speed, Senior Squad, The Empowered Athlete Program)
- **Database Enums**: Strongly typed enums for athletic programs, enrollment status, payment status, and user roles
- **Relationships**: Proper foreign key relationships ensuring data integrity across entities
- **Venues**: Specific Melbourne locations (Toorak College, Peninsula Grammar, Ballam Park Athletic Track, Mornington Athletic Track)

### Authentication & Authorization
- **Session Management**: Express-session with secure cookie configuration for production environments
- **Password Security**: bcrypt hashing with salt rounds for secure password storage
- **Role-Based Access**: Multi-role system (parent, coach, admin) with route-level authorization
- **User Identification**: Flexible login supporting email, mobile number, or custom user ID

### External Dependencies

#### Payment Processing
- **Stripe Integration**: Full Stripe payment processing with React Stripe.js components
- **Payment Intent API**: Secure payment handling with client-side confirmation
- **Webhook Support**: Server-side payment verification and status updates

#### Database Services
- **Neon Database**: Serverless PostgreSQL with connection pooling and WebSocket support
- **Migration System**: Drizzle Kit for database schema migrations and version control

#### Development Tools
- **Replit Integration**: Development environment optimization with Cartographer plugin and runtime error handling
- **Type Safety**: Comprehensive TypeScript configuration across frontend, backend, and shared schemas
- **Form Validation**: React Hook Form with Zod schemas for robust client-side validation

#### UI/UX Libraries
- **Component System**: Extensive Radix UI primitive collection for accessibility compliance
- **Icon Library**: Lucide React for consistent iconography
- **Styling Utilities**: Class variance authority for component variants and clsx for conditional styling