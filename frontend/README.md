# Vank Cliff

A comprehensive crypto portfolio management platform built with Next.js 15, React 19, and Dynamic.xyz for Web3 authentication.

## Features

- 🔐 **Web3 Authentication** - Secure login with 500+ wallet support via Dynamic.xyz
- 📱 **Responsive Design** - Mobile-first approach with hamburger menu on mobile
- 🎨 **Centralized Theming** - Easy color customization from a single source
- 📊 **Portfolio Management** - Track your crypto holdings and performance
- ⚡ **Loading States** - Comprehensive loading indicators throughout the app
- 🔄 **Real-time Data** - Live updates for portfolio and market data
- 🌈 **Beautiful UI** - Modern design with Helvetica Neue typography

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: Dynamic.xyz Web3 SDK
- **Styling**: CSS-in-JS with centralized theme system
- **Font**: Helvetica Neue

## Setup Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/vank-cliff.git
cd vank-cliff
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Dynamic.xyz Authentication

1. Go to [Dynamic.xyz Dashboard](https://app.dynamic.xyz/dashboard/developer)
2. Create a new project or use an existing one
3. Copy your Environment ID
4. Create a `.env.local` file in the project root:

```bash
# Dynamic.xyz Configuration
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Dynamic provider
│   ├── page.tsx           # Main page with auth guard
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AppBar.tsx         # Top navigation bar
│   ├── AuthGuard.tsx      # Authentication wrapper
│   ├── LoadingCard.tsx    # Loading state component
│   ├── LoadingSpinner.tsx # Spinner component
│   ├── LoginPage.tsx      # Login/auth page
│   ├── MainContent.tsx    # Main content area
│   └── Sidebar.tsx        # Navigation sidebar
├── constants/             # App constants
│   └── app.ts             # Centralized app constants
├── hooks/                 # Custom React hooks
│   └── useResponsive.ts   # Mobile detection hook
├── providers/             # Context providers
│   └── DynamicProvider.tsx # Dynamic.xyz setup
└── theme/                 # Theme configuration
    └── colors.ts          # Centralized colors & typography
```

## Theme Customization

All theme colors are centralized in `src/theme/colors.ts`. Update the color palette here:

```typescript
export const colors = {
  primary: '#6F2DBD',      // Main purple
  secondary: '#A663CC',    // Light purple
  accent: '#B298DC',       // Accent purple
  light: '#B8D0EB',        // Light blue
  mint: '#B9FAF8',         // Mint/cyan
  // ... more colors
}
```

## App Constants

All app-related constants are centralized in `src/constants/app.ts`:

```typescript
export const APP_NAME = 'Vank Cliff'
export const APP_DESCRIPTION = 'Advanced crypto portfolio management and trading platform'
// ... more constants
```

## Authentication Flow

1. **Initial Load**: Shows loading screen while Dynamic SDK initializes
2. **Unauthenticated**: Displays login page with wallet connection options
3. **Authenticated**: Shows main app with user wallet info in header
4. **Data Loading**: Individual components show loading states while fetching data

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Environment Variables

- `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` - Your Dynamic.xyz environment ID (required)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 