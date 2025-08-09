# Power2ADAPT - Athletic Program Management System

## Overview

Power2ADAPT is a comprehensive athletic program management platform with both web and mobile applications. The system serves multiple user types including parents, coaches, and administrators, providing features for class enrollment, payment processing via Stripe, and program administration. Built as a full-stack application with React web frontend, React Native mobile apps, and Express backend, it offers a complete cross-platform solution for sports program management with real-time enrollment tracking, child profile management, and integrated payment workflows. The mobile apps provide an intuitive, client-friendly interface for parents to manage enrollments on-the-go.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Senior Squad Application System (August 2025) - ✅ COMPLETED
- **Professional Application Form**: Comprehensive modal application form replacing simple login for Senior Squad program
- **Detailed Information Capture**: Athlete information, athletic background, goals, training commitment, and availability assessment
- **Parent/Guardian Integration**: Separate contact fields for underage athletes with parent/guardian information
- **Database Schema**: Complete Senior Squad applications table with admin review workflow and status tracking
- **API Integration**: Full backend endpoints for application submission, admin review, and status management
- **SMS Confirmation**: Automatic SMS notifications sent to applicants confirming successful application submission
- **Elite Program Treatment**: Professional application process befitting the premium nature of Senior Squad program

### High Performance Services Navigation (August 2025) - ✅ COMPLETED
- **Dedicated High Performance Page**: Created separate `/high-performance` route with comprehensive elite coaching services
- **Navigation Tab Integration**: Added "High Performance" tab to main navigation bar between Classes and Features
- **Content Reorganization**: Moved all 1-on-1 coaching, team consulting, and remote coaching services to dedicated page
- **Enhanced User Experience**: Cleaner landing page focused on school-based group programs, with elite services properly separated
- **Image Integration**: High-performance coaching photos (IMG_4312, IMG_4492) properly displayed with athlete nameplates visible
- **Professional Layout**: Dark gradient design distinguishing premium services from standard group programs

### Mobile App Implementation (August 2025) - ✅ COMPLETED
- **React Native Mobile App**: Complete iOS and Android app implementation using Expo framework
- **Cross-Platform Architecture**: Shared codebase for iOS and Android with native performance
- **Mobile-First Features**: Touch-optimized UI, native navigation, offline capabilities
- **Authentication Integration**: Secure mobile authentication with token storage
- **API Integration**: Full integration with existing Power2ADAPT backend APIs
- **Material Design UI**: Professional mobile interface using React Native Paper
- **User Testing**: Successfully tested by user - confirmed easy and intuitive for clients
- **Tunnel Server Setup**: Expo development server configured with ngrok tunneling for live testing
- **Production Ready**: Complete build and deployment configuration for app stores

### Program Content Refinement (August 2025) - ✅ COMPLETED
- **Foundation Programs**: Updated to "Movement & Skill Foundation (via a Games approach)" with games-based learning approach
- **Emerging Programs**: Enhanced descriptions to emphasize team sport performance benefits and athletic movement development
- **Academy Structure**: Reorganized into Junior Development and Team Sport Athletes categories
- **Specialized Programs**: Updated age requirements and added Competition Ready program for dedicated athletes
- **Empowered Athlete Program**: Enhanced with online learning modules and personal development journal components
- **Pricing Structure**: Standardized to $30 + GST per class across all programs with clear GST indication

### User Interface Refinement (August 2025) - ✅ COMPLETED
- **Parent-Friendly Messaging**: Refined all user interface text to be more appealing and clear for parents
- **Dashboard Updates**: Changed "Parent Dashboard" to "Your Family Dashboard" with supportive messaging
- **Navigation Simplification**: Updated "Classes" to "Programs" and "Dashboard" to "My Family" for better clarity
- **Enrollment Flow**: Enhanced form labels and instructions to be more conversational and welcoming
- **Success Messages**: Improved notification text to be celebratory and reassuring for parents
- **Landing Page**: Refined hero messaging to focus on child development and parental benefits
- **Error Handling**: Made error messages more helpful and less technical for parent users

### Education Hub Branding & Community Integration (August 2025) - ✅ COMPLETED
- **Blog to Education Hub**: Rebranded "Blog" navigation tab to "Education" for better educational positioning
- **Page Title Updates**: Changed main heading from "Training Insights Blog" to "Education Hub"
- **Breadcrumb Consistency**: Updated all "Back to Blog" links to "Back to Education Hub"
- **Skool Community Integration**: Added prominent yellow call-to-action button linking to Skool community
- **Parent Engagement**: Community link positioned prominently with parent-focused messaging about connecting with other families

### SMS Notification System (August 2025) - ✅ COMPLETED
- **Twilio Integration**: Complete SMS service implementation with professional parent-friendly messaging
- **Enrollment Notifications**: Automatic SMS confirmation when children are enrolled or added to waitlists
- **Payment Confirmations**: Instant SMS notifications when payments are successfully processed
- **Class Reminders**: Automated reminder system for upcoming classes with venue and time details
- **Admin SMS Interface**: Comprehensive admin panel for sending individual messages and broadcast notifications
- **Message Templates**: Pre-built parent-friendly message templates for common communications
- **Waitlist Notifications**: Automatic SMS alerts when spots become available for waitlisted children
- **Term Renewal Reminders**: Automated 1-month advance notifications for term re-enrollment

### Holiday Management System (August 2025) - ✅ COMPLETED
- **Comprehensive Holiday Database**: Complete termHolidays table with proper relations to term configurations
- **Holiday CRUD Operations**: Full storage layer and API endpoints for creating, reading, and deleting holidays
- **Admin Holiday Interface**: User-friendly dialog for adding holidays with date picker, name, and type selection
- **Automatic Pricing Adjustments**: System automatically excludes holiday dates from pricing calculations
- **Teaching Week Calculations**: Visual display of total weeks vs effective teaching weeks with holiday impact
- **Holiday Type Management**: Support for public holidays, student-free days, and term breaks
- **Real-time Price Updates**: Dynamic pricing recalculation when holidays are added or removed
- **Authentication & Routing Fixes**: Resolved critical admin access issues for seamless holiday management

### Class and Staff Management System (August 2025) - ✅ COMPLETED
- **Dedicated Admin Routes**: Created /admin/classes and /admin/staff routes with proper authentication
- **Class Management Interface**: Complete CRUD operations for adding, editing, and deleting classes
- **Staff Management System**: Comprehensive user account and coach profile management
- **API Endpoints**: Full REST API for class and staff operations with role-based access control
- **Database Operations**: Enhanced storage layer with new methods for class and staff management
- **Admin Dashboard Integration**: Connected management buttons to dedicated admin pages
- **Coach Profile Management**: Automatic coach profile creation for staff with coach role
- **Security Implementation**: Proper authentication and authorization for all admin operations

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