# WowDash - Node.js Admin Dashboard Template

A modern, responsive, and multipurpose admin dashboard template built with Node.js, Express.js, and EJS templating engine. WowDash offers a comprehensive solution for building administrative interfaces with a clean, professional design.

## ✨ Features

- 🎨 **Modern UI Design** - Clean and professional interface with responsive layouts
- 🌙 **Dark/Light Theme** - Toggle between light and dark modes
- 🌐 **RTL Support** - Right-to-left language support for international use
- 📱 **Responsive Design** - Works seamlessly across all devices and screen sizes
- 🚀 **Fast Performance** - Built with Express.js for optimal server-side performance
- 📊 **Rich Components** - Comprehensive set of UI components including charts, tables, forms
- 🔧 **Easy Customization** - Well-organized code structure for easy modifications
- 📈 **Dashboard Analytics** - Built-in analytics and reporting components
- 👥 **User Management** - Complete user management system
- 🗃️ **Data Tables** - Advanced table components with sorting and filtering
- 📝 **Form Elements** - Extensive form components and validation
- 🎯 **AI Integration** - AI-powered features and components

## 🛠️ Technology Stack

- **Backend:** Node.js, Express.js
- **Template Engine:** EJS (Embedded JavaScript)
- **Styling:** CSS3, SCSS, Bootstrap-based
- **Icons:** Iconify, Font Awesome
- **Development:** Nodemon for hot reloading

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 20.11.0 or higher recommended)
- **npm** (comes with Node.js)

## 🚀 Quick Start

### 1. Clone or Download
Download and extract the project files to your desired directory.

### 2. Navigate to Project Directory
```bash
cd WowDash
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
For development with hot reloading:
```bash
npm run dev
```

For production:
```bash
npm start
```

### 5. Access Application
Open your browser and navigate to:
```
http://localhost:8080
```

## 📁 Project Structure

```
WowDash/
├── app.js                 # Main application entry point
├── package.json          # Project dependencies and scripts
├── public/               # Static assets
│   ├── css/             # Stylesheets
│   ├── js/              # JavaScript files
│   ├── images/          # Images and media
│   ├── fonts/           # Font files
│   └── webfonts/        # Web font files
├── routes/              # Express.js route handlers
│   ├── routes.js        # Main routing configuration
│   ├── dashboard.js     # Dashboard routes
│   ├── users.js         # User management routes
│   ├── forms.js         # Form handling routes
│   ├── table.js         # Data table routes
│   ├── chart.js         # Chart and analytics routes
│   ├── settings.js      # Application settings routes
│   ├── ai.js            # AI-related routes
│   ├── cryptoCurrency.js # Cryptocurrency features
│   └── rolesAndAccess.js # Role-based access control
└── views/               # EJS templates
    ├── layout/          # Layout templates
    ├── pages/           # Page templates
    └── partials/        # Reusable template components
```

## 📜 Available Scripts

- `npm start` - Start the production server
- `npm run dev` - Start development server with nodemon (auto-reload)

## 🎨 Features Overview

### Dashboard Components
- **Analytics Dashboard** - Comprehensive analytics and metrics
- **User Management** - Complete CRUD operations for users
- **Data Tables** - Advanced tables with search, filter, and pagination
- **Charts & Graphs** - Various chart types for data visualization
- **Form Components** - Extensive form elements and validation
- **Settings Panel** - Application configuration management

### UI Components
- **Basic Components** - Buttons, cards, alerts, badges, and more
- **Advanced Components** - Complex widgets and interactive elements
- **Form Elements** - Input fields, selectors, file uploads, and validation
- **Navigation** - Sidebars, breadcrumbs, and navigation menus
- **Layout Options** - Multiple layout configurations

### Theme Features
- **Light Theme** - Clean and bright interface
- **Dark Theme** - Modern dark mode for reduced eye strain
- **RTL Support** - Complete right-to-left language support
- **Responsive Design** - Mobile-first responsive layout

## 🔧 Customization

### Styling
- Modify CSS files in the `public/css/` directory
- SCSS source files available for advanced customization
- Theme variables can be customized for brand colors

### Adding New Routes
1. Create a new route file in the `routes/` directory
2. Define your routes using Express.js router
3. Import and use the route in `routes/routes.js`

### Adding New Pages
1. Create EJS templates in the `views/` directory
2. Use the existing layout system for consistency
3. Add corresponding routes to handle the new pages

## 🌐 Browser Support

WowDash supports all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📖 Documentation

For detailed documentation including component usage, customization guides, and advanced features, please refer to the `documentation/` folder included with this template.

## 👨‍💻 Development

### Local Development
1. Follow the installation steps above
2. Use `npm run dev` for development with hot reloading
3. Make your changes to the appropriate files
4. The server will automatically restart when files are modified

### Production Deployment
1. Install dependencies: `npm install --production`
2. Set environment variables as needed
3. Start the server: `npm start`
4. Configure your web server (nginx, Apache) to proxy requests

## 📄 License

This project is licensed under the ISC License.

## 👤 Author

**Pixcels Themes**

## 🤝 Support

For support and questions, please refer to the documentation or contact the theme author.

---

### 🚀 Get Started Today!

Transform your admin panel with WowDash - the ultimate Node.js admin dashboard template that combines modern design with powerful functionality.