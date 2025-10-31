# TRAKM - Neighbourhood Watch Management System

A comprehensive mobile app for security officers and neighbourhood watch coordinators to manage patrol monitoring, emergency alerts, community interaction, and reporting.

## Features

### 🔐 Authentication System
- Secure login/signup with email and password
- User role management (Security Officer, Resident, Admin)
- Form validation and error handling

### 📊 Dashboard
- Personalized welcome with user greeting
- Search functionality for alerts, officers, and locations
- Dashboard grid with key metrics:
  - Live Patrol Maps
  - Patrol Trends
  - Active Alerts
  - QR Scanner
- Real-time statistics and active zones monitoring

### 🚶 Patrol Monitoring
- QR code scanning for checkpoint verification
- Patrol logging with comments
- Scan history tracking
- Route management (Zone A, B, C)
- Real-time location tracking

### 🚨 Emergency Alerts
- Active alerts management with priority levels
- Color-coded priority system (High/Medium/Low)
- Alert resolution workflow
- Statistics and filtering options
- Quick actions for reporting and mapping

### 👥 Community Interaction
- Community updates and posts
- Upcoming events management
- Resident concerns tracking
- Quick messaging system
- Community statistics

### 📈 Reporting & Analytics
- Comprehensive analytics dashboard
- Data filtering by type and date range
- Report generation (Weekly, Monthly, Custom)
- Export options (PDF, Excel)
- Performance metrics and trends

## Technical Stack

- **Framework**: React Native with Expo (~54.0)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Navigation**: Expo Router (file-based routing)
- **UI**: Custom components with React Native
- **Icons**: Expo Vector Icons
- **Camera**: Expo Camera for QR scanning
- **Maps**: React Native Maps
- **Platform Support**: iOS, Android, Web

## Database Schema

The app uses a comprehensive PostgreSQL schema with the following main entities:

- **Users**: Base user table with authentication
- **Security Officers**: Patrol personnel management
- **Neighborhood Members**: Resident management
- **Emergency Alerts**: Incident tracking
- **Patrol Scans**: QR code scan records
- **Community Posts**: Community interaction
- **QR Codes**: Checkpoint management
- **Reports**: Analytics and reporting

### Member features schema additions

Run the SQL in `supabase/schema.sql` to add:

- `community_comments` table for post comments
- Indexes for faster queries
- Optional `qr_codes.member_id` to link a QR to a member house

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd trakm-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Run the provided SQL schema in your Supabase SQL editor
   - Get your project URL and anon key

4. **Configure environment variables**
   Create a `.env` file in the root directory:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on your preferred platform**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web
   npm run web
   ```

## Project Structure

```
trakm-mobile/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Main app tabs
│   │   ├── index.tsx     # Dashboard
│   │   ├── patrol.tsx    # Patrol monitoring
│   │   ├── alerts.tsx    # Emergency alerts
│   │   ├── community.tsx # Community features
│   │   └── reports.tsx   # Analytics & reports
│   ├── auth/             # Authentication screens
│   │   ├── login.tsx     # Login screen
│   │   └── signup.tsx    # Signup screen
│   └── _layout.tsx       # Root layout
├── components/           # Reusable components
├── contexts/            # React contexts
│   └── AuthContext.tsx  # Authentication context
├── lib/                 # Utilities and configurations
│   └── supabase.ts      # Supabase client setup
└── constants/           # App constants
```

## Key Features Implementation

### Authentication Flow
- Secure user authentication with Supabase
- Role-based access control
- Automatic session management
- Route protection

### QR Code Scanning
- Camera integration for QR code scanning
- Real-time checkpoint verification
- Offline scan storage with sync
- Location tracking integration

### Real-time Updates
- Live dashboard updates
- Push notifications for alerts
- Real-time patrol tracking
- Community updates feed

### Dark Theme Design
- Consistent dark theme throughout the app
- Color-coded priority system
- Intuitive navigation
- Modern UI/UX design

## Database Setup

Run the provided SQL schema in your Supabase SQL editor to set up all necessary tables, relationships, and indexes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.