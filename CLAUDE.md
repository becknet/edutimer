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