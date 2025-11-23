# Crisis Care Connect - MedStock Crisis Manager

A comprehensive logistics management system for crisis zones, featuring dual-view architecture for frontline hospital staff and Ministry of Health command center operations.

## Overview

**Crisis Care Connect** is a real-time medical supply chain management platform designed for emergency situations. It provides two distinct views:

1. **Ministry of Health View** (`/ministryofhealth`) - Command center dashboard for monitoring all hospitals, tracking supplies, managing deliveries, and coordinating resupply operations
2. **Hospital View** (`/hospitalview`) - Frontline interface for individual hospitals to manage their inventory, track resources, and update stock levels

## Key Features

### Ministry of Health View
- **Dashboard**: Overview of all hospitals with status indicators, interactive map, and warehouse stock levels
- **Grid View**: Visual cards showing each hospital's resource status with color-coded indicators (red/yellow/green)
- **Table View**: Sortable and filterable table of all hospitals and their resources
- **Hospital Detail Pages**: 
  - Detailed resource breakdown with supply duration forecasts
  - Interactive charts showing days remaining for each resource
  - Delivery tracking for in-transit supplies
  - Past deliveries history with order type (automatic/manual)
  - Staff and department information
- **Interactive Map**: Leaflet-based map with color-coded hospital markers
- **Real-time Sync**: Live updates from hospital view for Indonesian Hospital

### Hospital View
- **Frontline Interface**: Department-based inventory management
- **Resource Tracking**: Monitor IV Fluids, O2 Tanks, Insulin, Antibiotics, and Anesthesia
- **Staff Management**: Track Trauma Surgeons, ER Doctors, and Pediatricians
- **Real-time Updates**: Changes sync immediately to Ministry view
- **Offline-first Design**: Works in crisis zones with limited connectivity

## Technology Stack

### Core
- **React** 18.3.1 - UI framework
- **TypeScript** 5.8.3 - Type safety
- **Vite** 5.4.19 - Build tool and dev server

### UI & Styling
- **Tailwind CSS** 3.4.17 - Utility-first CSS framework
- **Shadcn/ui** (Radix UI) - Accessible component library
- **next-themes** - Dark/light theme management
- **Lucide React** - Icon library

### Routing & State
- **React Router DOM** 6.30.1 - Client-side routing
- **TanStack React Query** 5.83.0 - Server state management

### Maps & Visualization
- **Leaflet** 1.9.4 - Interactive maps
- **React Leaflet** 4.2.1 - React wrapper for Leaflet
- **Recharts** 2.15.4 - Charting library

### Forms & Validation
- **React Hook Form** 7.61.1 - Form handling
- **Zod** 3.25.76 - Schema validation

### Data Synchronization
- **localStorage** - Cross-application data storage
- **Custom Events** - Real-time updates between views
- **Polling** - Fallback for cross-origin scenarios

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **npm** or **bun** package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd crisis-care-connect
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Start the development server:
```bash
npm run dev
# or
bun dev
```

4. Open your browser:
   - Ministry of Health View: `http://localhost:8080/ministryofhealth`
   - Hospital View: `http://localhost:8080/hospitalview`

## Project Structure

```
crisis-care-connect/
├── src/                          # Ministry of Health view
│   ├── components/              # React components
│   │   ├── DashboardView.tsx   # Main dashboard
│   │   ├── MapView.tsx         # Grid view of hospitals
│   │   ├── HospitalMap.tsx     # Interactive Leaflet map
│   │   ├── TableView.tsx       # Sortable table view
│   │   └── ui/                 # Shadcn/ui components
│   ├── pages/                  # Page components
│   │   ├── Index.tsx           # Main page with tabs
│   │   ├── HospitalDetail.tsx # Individual hospital page
│   │   └── PastDeliveries.tsx # Delivery history
│   ├── hooks/                  # Custom React hooks
│   │   └── useMedicalCenters.ts # Medical centers data hook
│   ├── data/                   # Mock data and utilities
│   │   └── mockData.ts         # Hospital data generators
│   ├── types/                  # TypeScript definitions
│   │   └── medical.ts         # Medical data types
│   └── utils/                  # Utility functions
│       └── hospitalSync.ts     # Cross-app data synchronization
├── Hospital_view/              # Hospital view application
│   └── UCLXImperialXMMU/
│       ├── App.tsx             # Hospital view main app
│       ├── components/         # Hospital view components
│       └── types.ts            # Hospital view types
├── public/                      # Static assets
│   └── favicon.svg             # Application favicon
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── tsconfig.json               # TypeScript configuration
```

## Features in Detail

### Color-Coded Status System
- **Red (Critical)**: < 2 days of supply remaining (hospital view) or < 30% of needed capacity (ministry view)
- **Yellow (Warning)**: 2-5 days of supply or 30-70% of needed capacity
- **Green (Good)**: > 5 days of supply or > 70% of needed capacity

### Real-time Data Synchronization
The Indonesian Hospital (ID: 'h1' in hospital view, ID: '5' in ministry view) syncs data in real-time:
- Resource quantities (IV Fluids, O2 Tanks, Insulin, Antibiotics, Anesthesia)
- Daily usage rates for accurate days-remaining calculations
- Patient capacity and current patient count
- Staff and department information

### Delivery Tracking
- Active deliveries show estimated arrival dates
- Color-coded resources in transit
- Past deliveries include order type (automatic/manual)

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Architecture

This is a **monorepo-style** application with two separate React applications running under different routes:
- Both apps share the same Vite dev server
- They use `localStorage` and custom events for data synchronization
- The hospital view uses Tailwind via CDN, while the ministry view uses PostCSS/Tailwind

## License

This project is part of a crisis response logistics management system.

## Contributing

This is a prototype/demo application for crisis logistics management. For production use, additional features such as:
- Backend API integration
- Database persistence
- User authentication
- Multi-hospital synchronization
- Offline-first PWA capabilities

Would need to be implemented.
