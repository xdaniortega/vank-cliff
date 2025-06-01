# VankCliff Frontend

A modern, blockchain-powered payroll and employee management system built with Next.js, React, and Web3 technologies.

## 🏗️ Project Overview

VankCliff is a decentralized application (dApp) that enables companies to manage payroll, employee rewards, and treasury operations on the blockchain. The frontend provides an intuitive interface for both companies and employees to interact with smart contracts and track their financial activities.

### Key Features

- **Company Dashboard**: Treasury management, payroll creation, and employee oversight
- **Individual Dashboard**: Personal payroll tracking, transaction history, and merit rewards
- **Blockchain Integration**: Direct smart contract interactions using Wagmi and Viem
- **Real-time Data**: Live blockchain data fetching and transaction monitoring
- **Merit System**: Employee recognition system integrated with Blockscout API
- **Responsive Design**: Mobile-first approach with modern UI/UX

## 🚀 Tech Stack

### Core Technologies
- **Framework**: Next.js 15.2.4 (App Router)
- **Language**: TypeScript 5.7.2
- **Frontend**: React 19.0.0
- **Styling**: CSS-in-JS with custom theme system

### Blockchain & Web3
- **Wallet Connection**: Dynamic Labs SDK
- **Contract Interactions**: Wagmi 2.15.4 + Viem 2.30.5
- **Smart Contract ABIs**: Custom payroll contract integration

### UI & Design
- **Icons**: Lucide React
- **Layout**: CSS Grid and Flexbox
- **Theme**: Custom design system with consistent colors, typography, and spacing
- **Responsive**: Mobile-first responsive design

### External APIs
- **Blockscout API**: Transaction history and merit system
- **Price APIs**: Real-time cryptocurrency pricing
- **Custom Backend**: Company and employee data management

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vank-cliff/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the frontend directory:
   ```env
   # Add your environment variables here
   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_contract_address
   NEXT_PUBLIC_BLOCKSCOUT_API_URL=your_blockscout_api_url
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📜 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Deployment
npm run predeploy    # Pre-deployment build
npm run deploy       # Deploy to GitHub Pages
```

## 🔧 Configuration

### Next.js Configuration
The application is configured for static export with GitHub Pages deployment support:

```javascript
// next.config.js
const isProd = process.env.NODE_ENV === 'production';
const nextConfig = {
  reactStrictMode: true,
  images: { unoptimized: true },
  assetPrefix: isProd ? '/vank-cliff/' : '',
  basePath: isProd ? '/vank-cliff' : '',
  output: 'export'
};
```

### TypeScript Configuration
Strict TypeScript configuration with Next.js optimizations and path aliases.

## 🎨 Design System

### Colors
- **Primary**: #6F2DBD (Purple)
- **Secondary**: #A663CC (Light Purple)
- **Accent**: #B298DC (Lavender)
- **Success**: #10B981 (Green)
- **Error**: #EF4444 (Red)

## 🔌 API Integrations

### Blockscout API
- Transaction history tracking
- Merit system integration
- Real-time blockchain data

### Custom Backend APIs
- Company and employee management
- Payroll processing
- Treasury balance tracking

### Price APIs
- Real-time cryptocurrency pricing
- Multi-currency support

## 🚀 Deployment

### GitHub Pages
The application is configured for GitHub Pages deployment:

1. Build the application: `npm run build`
2. Deploy: `npm run deploy`

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.