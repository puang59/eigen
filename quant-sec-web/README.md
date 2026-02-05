# Quantum Secure Email - Web Frontend

A modern Next.js web interface for the quantum-secure email client, featuring Kyber512 post-quantum encryption visualization.

## Features

- **User Authentication**: Login and registration with Kyber512 keypair generation
- **Email Composition**: Send encrypted emails with real-time encryption flow visualization
- **Inbox Management**: Sync and decrypt emails with decryption step visualization
- **Kyber Visualizer**: Interactive exploration of how Kyber512 encryption works
- **Dark Theme**: Modern, sleek UI with quantum-inspired aesthetics

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Runtime**: Bun
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Storage**: IndexedDB (via idb)
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Getting Started

### Prerequisites

1. **Bun** - Install from [bun.sh](https://bun.sh)
2. **Django Server** - The backend server must be running

### Setup

1. Install dependencies:
   ```bash
   cd quant-sec-web
   bun install
   ```

2. Start the development server:
   ```bash
   bun dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

### Backend Setup

Before using the frontend, ensure the Django server is running:

1. Install Python dependencies:
   ```bash
   pip install -r ../requirements.txt
   ```

2. Run migrations (if needed):
   ```bash
   cd ../quant-sec-server/server
   python manage.py migrate
   ```

3. Start the Django server:
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

## Project Structure

```
quant-sec-web/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing/Auth page
│   │   ├── dashboard/         # User dashboard
│   │   ├── compose/           # Email composition
│   │   ├── inbox/             # Inbox management
│   │   └── visualizer/        # Kyber algorithm visualizer
│   ├── components/
│   │   ├── auth/              # Authentication forms
│   │   ├── crypto/            # Encryption visualizations
│   │   ├── email/             # Email components
│   │   └── ui/                # Shared UI components
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   ├── db.ts              # IndexedDB wrapper
│   │   └── types.ts           # TypeScript types
│   └── store/
│       └── auth.ts            # Zustand auth store
└── package.json
```

## API Endpoints

The frontend communicates with these Django endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/quantserver/api/login/` | POST | User authentication |
| `/quantserver/api/register/` | POST | User registration with keygen |
| `/quantserver/api/keygen/` | POST | Generate Kyber512 keypair |
| `/quantserver/api/encrypt/` | POST | Encrypt message |
| `/quantserver/api/decrypt/` | POST | Decrypt message |
| `/quantserver/api/kyber-params/` | GET | Get Kyber512 parameters |
| `/quantserver/get-public-key/` | GET | Get user's public key |
| `/quantserver/post-email/` | POST | Send encrypted email |
| `/quantserver/get-inbox/` | GET | Retrieve inbox |
| `/quantserver/clear-inbox/` | POST | Clear inbox |

## Security Notes

- Private keys are stored securely in IndexedDB (browser storage)
- All email content is encrypted using Kyber512 + AES hybrid encryption
- The server stores encrypted ciphertext only; decryption happens client-side
- SHA-256 integrity tags verify message authenticity

## License

MIT
