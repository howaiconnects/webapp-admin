# WowDash Admin Dashboard

This directory contains the WowDash admin dashboard frontend template.

## Overview

- The dashboard is a fully-featured admin panel built with modern web technologies.
- It includes multiple UI components, charts, tables, forms, and layouts.
- The project is structured with public assets, routes, views, and styles.

## Folder Structure

- `public/` - Static assets including CSS, fonts, images, and JavaScript libraries.
- `routes/` - JavaScript route handlers for various features.
- `views/` - EJS templates for rendering frontend pages.
- `sass/` - SCSS source files for styling.
- `js/` - Custom JavaScript files for dashboard functionalities.

## Local Development Setup

1. Ensure you have Node.js and npm installed.

2. Install dependencies:

```bash
cd wowdash-admin-dashboard
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000` (or the port specified).

## Integration Notes

- This dashboard is standalone and can be integrated with backend APIs by modifying the routes and views.
- Adjust API endpoints in `routes/` as needed to connect with your backend services.
- Customize styles and components in `sass/` and `js/` folders.

## Additional Resources

- Documentation is available under the `documentation/` folder for UI components and usage.
- For production deployment, build and optimize assets as per standard Node.js application practices.
