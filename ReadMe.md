# 🚀 DataHarbor

**DataHarbor** is a decentralized data labeling platform built on **Solana** that connects **data owners** with **workers** in a secure and transparent ecosystem.

Users can upload image labeling tasks, while workers complete those tasks and receive **SOL** as rewards. Payments are managed automatically through wallet-based authentication and blockchain integration.

> **Note:** The backend and core platform logic are fully functional. The frontend is currently in development and will continue to receive UI/UX improvements.

---

## ✨ Features

### 👤 User

* Connect using a Solana wallet
* Upload image labeling tasks
* Create decentralized labeling jobs
* Monitor uploaded tasks

### 👷 Worker

* Connect using a Solana wallet
* Secure wallet-based authentication using message signing
* Receive labeling tasks
* Submit labels
* Automatically earn SOL for completed tasks
* Withdraw earnings directly to their wallet

### ⚙️ Backend

* Wallet authentication using Solana signatures
* Nonce-based login for secure authentication
* Task creation and assignment
* Label submission APIs
* Automatic worker payment management
* PostgreSQL database with Prisma ORM
* JWT-based authorization

---

# 📂 Project Structure

```text
DataHarbor/
│
├── backend/            # Express backend, APIs, database & payment logic
│
├── user-frontend/      # Frontend for task creators (Users)
│
├── worker-frontend/    # Frontend for data labeling workers
│
└── README.md
```

---

# 🛠 Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* Solana Wallet Adapter
* Axios

### Backend

* Node.js
* Express.js
* TypeScript
* Prisma ORM
* PostgreSQL
* JWT Authentication

### Blockchain

* Solana
* @solana/web3.js
* Wallet Signature Authentication
* bs58

---

# ⚙️ Installation

Clone the repository

```bash
git clone https://github.com/TusharSin810/DataHarbor.git

cd DataHarbor
```

---

## Backend

```bash
cd backend

npm install
```

Create a `.env` file

```env
DATABASE_URL=

JWT_SECRET=

RPC_URL=

PRIVATE_KEY=
```

Run

```bash
npm run dev
```

---

## User Frontend

```bash
cd user-frontend

npm install

npm run dev
```

---

## Worker Frontend

```bash
cd worker-frontend

npm install

npm run dev
```

---

# 🔐 Authentication Flow

1. User connects a Solana wallet.
2. Backend generates a unique nonce.
3. Wallet signs the nonce.
4. Signature is verified by the backend.
5. JWT token is issued.
6. Authenticated users can access protected APIs.

---

# 💸 Payment Flow

1. Worker completes a labeling task.
2. Backend validates the submission.
3. Rewards are credited to the worker.
4. Worker can withdraw accumulated SOL directly to their wallet.

---

# 🚧 Current Status

✅ Backend completed

✅ Authentication completed

✅ Task allocation completed

✅ Worker payout system completed

✅ Database integration completed

🚧 User frontend UI in progress

🚧 Worker frontend UI improvements in progress

---

# 🎯 Future Improvements

* Better UI/UX
* Image annotation tools
* Task history
* Dashboard analytics
* Admin dashboard
* Multi-label task support
* Rating & reputation system
* Better reward distribution
* IPFS integration for decentralized storage

---

# 🤝 Contributing

Contributions, feature requests, and suggestions are always welcome.

Feel free to fork the repository, create a new branch, and open a Pull Request.

---

# 👨‍💻 Author

**Tushar Singhal**

GitHub: https://github.com/TusharSin810

If you found this project useful, consider giving it a ⭐ on GitHub!
