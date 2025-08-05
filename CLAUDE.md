# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduTimer is a Progressive Web App (PWA) for time tracking designed specifically for teachers in Canton Basel-Landschaft. The application runs entirely in the browser using IndexedDB for local storage and works offline.

## Architecture

- **Frontend-only application**: No backend server required
- **Vanilla JavaScript**: No frameworks used, pure JS with Bootstrap 5 for UI
- **IndexedDB Database**: Local browser storage with three object stores:
  - `config`: User configuration (yearly hours, employment rate, age, period)
  - `entries`: Time entries with date indexing
  - `categories`: Work categories (default A-F plus custom categories)
- **PWA capabilities**: Can be installed on mobile devices as a native app

## Core Components

### Database Layer (`script/script.js:1-70`)
- `openDB()`: Initialize IndexedDB with automatic versioning and store creation
- Three object stores: config, entries (with date index), categories
- `seedCategories()`: Populate default work categories A-F on first run

### Configuration Management (`script/script.js:152-498`)
- Stores yearly work hours, employment percentage, age, and work period
- Age affects vacation day calculations (25/27/30 days based on <50/<60/60+ years)
- Date validation ensures start date is before end date

### Time Entry System (`script/script.js:166-532`)
- Date-based entry loading using IndexedDB index for performance
- Modal-based entry creation/editing with hours/minutes input
- Real-time daily totals calculation

### Statistics and Reporting (`script/script.js:282-364`)
- Calculates SOLL/IST hours for work categories A+B (87.4%) and C+D+E (12.6%)
- Individual category breakdowns including custom categories
- Required hours calculation based on employment rate, age, and work period

### Data Import/Export (`script/script.js:411-474`)
- CSV export with all time entries
- CSV import with data validation
- Timestamped export filenames

## Key Business Logic

### Work Categories
- **Default categories**: A (Teaching), B (Teaching-related), C (School-related), D (Counseling), E (Professional development), EA (Special functions)
- **Custom categories**: Users can add/remove additional categories
- **Category distribution**: A+B should be ~87.4%, C+D+E should be ~12.6% of total hours

### Time Calculations
- Vacation days deducted from required hours: 8.4h × vacation days × employment rate
- Required hours = (yearly hours × employment rate) × (period days / 365) - vacation hours
- Daily navigation with previous/next buttons and date picker

## Development Guidelines

### File Structure
```
/
├── index.html          # Main HTML file with all UI sections
├── css/style.css       # Minimal custom styles, mostly uses Bootstrap
├── script/script.js    # All application logic in single file
├── favicon.png         # PWA icon
└── readme.md          # German documentation
```

### Code Patterns
- Event-driven architecture with DOM event listeners
- Promise-based IndexedDB operations
- Bootstrap modal for entry editing
- Section-based navigation (day/overview/config views)

### Data Validation
- Form validation for required fields
- Date range validation (start < end)
- Category uniqueness checks
- Non-zero time entry validation

## No Build Process
This is a static web application that runs directly in the browser. Simply open `index.html` in a web server or directly as a file. No compilation, bundling, or build tools are used.
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EduTimer is a Progressive Web App (PWA) for time tracking specifically designed for teachers in Basel-Land, Switzerland. It's a client-side only application that runs entirely in the browser using IndexedDB for local storage.

## Architecture

### Core Components
- **Single Page Application**: All functionality contained in `index.html` with JavaScript modules
- **IndexedDB Storage**: Three object stores handle all data persistence:
  - `config`: User settings (work hours, employment rate, age, school year dates)
  - `entries`: Time tracking entries with date indexing
  - `categories`: Work categories (default A-E, EA plus custom categories)

### Key JavaScript Functions
- `openDB()`: IndexedDB initialization and schema management
- `tx()`: Transaction helper for database operations
- `loadEntries(date)`: Loads and displays entries for specific date using indexed queries
- `renderOverview()`: Calculates and displays work hour statistics
- `calculateRequiredHours()`: Complex calculation considering employment rate, age-based vacation days, and work periods

### Data Flow
1. Configuration stored in `config` store (ID=1)
2. Categories seeded with defaults on first run, custom categories added by user
3. Entries indexed by date for efficient daily view queries
4. Statistics calculated by aggregating entries across date ranges

## Development

### Local Development
- No build process required - static files served directly
- Open `index.html` in browser or serve via local web server (MAMP/XAMPP)
- All dependencies loaded via CDN (Bootstrap 5, Bootstrap Icons)

### Testing
- No formal test suite - manual testing in browser
- Test CSV export/import functionality with `test_entries.csv`
- Verify PWA installation on mobile devices

## Key Features Implementation

### Date Navigation
- `currentDate` global variable tracks selected day
- Navigation buttons modify date and reload entries
- Date input allows direct date selection

### Category Management
- Default categories (A-E, EA) cannot be deleted
- Custom categories stored with auto-increment IDs
- Modal select populated with all categories for time entry

### Statistics Calculation
- SOLL/IST comparison based on Basel-Land work regulations
- Age-based vacation day calculation (25/27/30 days)
- Employment rate percentage applied to base work hours
- Category grouping: A+B (teaching), C+D+E (other duties)

## Code Conventions

### Database Operations
- Always use `tx()` helper for consistent transaction handling
- Use indexed queries when available (`by_date` index)
- Fallback to cursor scanning for compatibility

### UI Updates
- Bootstrap modal management for entry editing
- Dynamic table row generation for entries display
- Tooltip initialization for help text

### Date Handling
- ISO date format (YYYY-MM-DD) for consistent storage
- Local date display formatting for German locale
- Date range calculations for work period statistics