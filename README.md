# Tournament Match Maker

A modern web application for creating and managing tournament brackets and matches. Built with Next.js, TypeScript, and Supabase.

## Features

- **Tournament Management**
  - Choose between single elimination, round robin, swiss system
  - Players can send score reports for authenticating a legtimate match
  - All information is updated in realtime updates through Supabase connections
  - Automatic seeding and match generation
  - Message players privately
  - Send announcements to all players
  - Invite other organizers to assist you in running your tournament
  - Host a waitlist to let players in

- **User Experience**
  - Easy move player functionality
  - Responsive design for ease of use
  - Share a QR code or a join code for easy tournament sharing
  - Join tournaments anonymously without needing an account

- **Security & Authentication**
  - Secure user authentication with Supabase
  - Google reCAPTCHA integration
  - Role-based access control in database

- **Advanced Features**
  - Custom tournament rules and settings
  - Export the matches to JSON for data backup
  - Players are automically propogated to the next match when winner is selected
  - Auto score which declares winner
  - Support for team and individual tournaments

## Tech Stack

- **Frontend Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase
- **UI Components**: 
  - Framer Motion for animations
  - FontAwesome icons
- **Security**: Google reCAPTCHA

## Getting Started

Visit [https://tournament-match-maker.vercel.app/](https://tournament-match-maker.vercel.app/) and sign in to start creating and managing your tournaments!

## Installation

If you want to run the project locally or contribute to its development, follow these steps:

### Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- Supabase account and project

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/Jack-Crowley/Tournament-Match-Maker
cd tournament-match-maker
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
