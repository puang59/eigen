# Eigen


<a href="http://localhost:3000/dashboard/1150785926/chat?name=eigen&tab=chat"><img src="https://app.devdoq.com/shields/talk_to_code.png" alt="Talk to Code" width="125" height="30"></a>

A quantum-secure email client that uses **CRYSTALS-Kyber** (post-quantum key encapsulation) and **AES-256** encryption to protect emails against future quantum computer attacks.

---

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Client | Python | CLI-based email client for composing/reading encrypted emails |
| Server | Django + SQLite | REST API for user management and email storage |
| Web App | Next.js + TypeScript | Web interface for the email client |
| Encryption | CRYSTALS-Kyber | Quantum-resistant asymmetric key exchange |
| Encryption | AES-256 | Symmetric encryption for message content |
| Containerization | Docker | Server deployment |

---

## Run Locally

### Prerequisites

- Python 3.7+
- Node.js 18+ (for web app)
- Docker (optional, for containerized server)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-repo/eigen.git
cd eigen
```

**Python dependencies:**

```bash
# Windows
pip install -r requirements.txt

# macOS / Linux
pip3 install -r requirements.txt
```

### 2. Run the Server

```bash
cd quant-sec-server/server

# Windows
python manage.py migrate
python manage.py runserver 0.0.0.0:8000

# macOS / Linux
python3 manage.py migrate
python3 manage.py runserver 0.0.0.0:8000
```

### 3. Run the CLI Client

```bash
cd quant-sec-client

# Windows
python main.py

# macOS / Linux
python3 main.py
```

### 4. Run the Web App (Optional)

```bash
cd quant-sec-web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `connect` | Connect to an email server |
| `create-account` | Create a new account with Kyber key pair |
| `login` | Login to existing account |
| `compose` | Send an encrypted email |
| `sync` | Fetch and decrypt new emails |
| `list-emails` | View inbox emails |
| `clear-inbox` | Delete all inbox emails |
| `exit` | Exit the application |
