# First Pack Company - Asset Management System

A comprehensive web-based asset management system built with Next.js 16, Supabase, and React. Designed for tracking, managing, and auditing company assets across multiple branch locations in Zimbabwe.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-2-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## 🚀 Features

### Core Functionality
- **Asset Management**: Track assets with detailed information including serial numbers, models, manufacturers, purchase details, and current values
- **Branch Management**: Manage multiple branch locations with headquarters designation
- **Asset Categories**: Categorize assets with depreciation rates and useful life calculations
- **Asset Transfers**: Transfer assets between branches with approval workflows
- **Maintenance Tracking**: Record and schedule preventive, corrective, and emergency maintenance
- **Asset Audits**: Conduct physical verifications and track discrepancies
- **Asset Disposal**: Handle asset disposal through sale, donation, scrap, or write-off
- **Audit Logs**: Track all changes to assets with full history

### Dashboard & Reporting
- Real-time statistics and KPIs
- Asset status overview (active, in repair, disposed, transferred, lost, stolen)
- Asset distribution by category
- Branch overview and activity
- Recent assets table and trends
- Total asset value calculations

### User Interface
- Modern, responsive design with dark/light mode support
- Interactive data tables with sorting and filtering
- Form-based data entry with validation
- Status badges and visual indicators
- Mobile-friendly layout

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Components**: Radix UI primitives
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend & Database
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth
- **API**: Supabase Client (SSR)
- **Real-time**: Supabase Realtime

### Development Tools
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: ESLint

## 📋 Database Schema

The system uses the following main tables:

| Table | Description |
|-------|-------------|
| `branches` | Company branch locations |
| `asset_categories` | Asset classification categories |
| `assets` | Main asset inventory table |
| `asset_transfers` | Inter-branch asset transfers |
| `asset_maintenance` | Maintenance records |
| `asset_audits` | Physical audit records |
| `audit_items` | Individual asset verification items |
| `asset_disposals` | Asset disposal records |
| `audit_logs` | System change history |

## 🏗️ Project Structure

```
├── app/                    # Next.js app router pages
│   ├── assets/            # Asset management pages
│   ├── audits/           # Audit management pages
│   ├── auth/              # Authentication pages
│   ├── branches/         # Branch management pages
│   ├── categories/       # Category management
│   ├── disposals/        # Disposal management
│   ├── login/            # Login page
│   ├── logs/             # Audit logs page
│   ├── maintenance/      # Maintenance pages
│   ├── reports/          # Reports page
│   ├── transfers/        # Transfer pages
│   ├── unauthorized/     # Missing-role fallback page
│   ├── users/            # Admin-only user management
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Dashboard page
├── components/            # Reusable UI components
│   ├── ui/               # Radix UI based components
│   ├── app-sidebar.tsx   # Sidebar navigation
│   ├── dashboard-layout.tsx
│   └── stats-card.tsx
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase clients
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   └── validation.ts     # Zod validation schemas
├── public/                # Static assets
├── scripts/               # Database schema scripts
└── styles/                # Global styles
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Asset-Management-System-main
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the schema script in Supabase SQL editor:
   ```bash
   # Copy content from scripts/001-asset-management-schema.sql
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open the application**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Adding Assets
1. Navigate to Assets → Add New Asset
2. Fill in the asset details (tag, name, category, branch)
3. Add purchase information (price, date, warranty)
4. Set initial condition and status
5. Save the asset

### Conducting Audits
1. Navigate to Audits → New Audit
2. Select the branch to audit
3. Set audit date and auditor name
4. Complete the audit and record findings

### Transferring Assets
1. Navigate to Transfers → New Transfer
2. Select the asset to transfer
3. Choose destination branch
4. Add transfer reason
5. Submit for approval

## 📊 Supported Asset Statuses

| Status | Description |
|--------|-------------|
| `active` | Currently in use |
| `in_repair` | Under maintenance |
| `disposed` | Sold, donated, or scrapped |
| `transferred` | Moved to another branch |
| `lost` | Asset is missing |
| `stolen` | Reported as stolen |

## 🔧 Configuration

### Supabase Setup

1. Create a new Supabase project
2. Run the database schema in the SQL editor
3. Configure Row Level Security policies
4. Get your project URL and anon key

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

## 📝 License

This project is private and proprietary to First Pack Company Zimbabwe.

## 🤝 Support

For support, please contact the system administrator.

---

Built with ❤️ using Next.js, React, and Supabase
