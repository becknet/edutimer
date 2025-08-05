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