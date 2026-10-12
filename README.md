# 🏪 Digital Udhaar Khata (Digital Ledger & Credit Management System)

A production-ready, innovative, full-stack **Digital Udhaar Khata** system designed for small businesses, shopkeepers, and individuals. Built with **Java Spring Boot**, **React.js (Vite + Tailwind CSS)**, **Cloud MySQL (Aiven Cloud)**, and **AI Capabilities (OpenAI / Gemini API)** for automated credit risk scoring, natural language transaction parsing, and 1-click WhatsApp payment reminders.

---

## 🌟 Key Innovations & Features

### 1. 👥 Merchant & Customer Management
- **JWT Authentication & Security**: Role-based access control with secure bcrypt password hashing and statelessly validated JSON Web Tokens.
- **Customer Directory**: Add, update, view, and soft-manage customer credit accounts with mobile numbers, addresses, and individual credit limit caps.

### 2. 💳 Udhaar (Credit) & Balance Tracking
- **Dual-Entry Forms**:
  - **Give Credit (`Udhaar Diya` - Red)**: Extends goods/services on credit.
  - **Receive Payment (`Paisa Mila` - Green)**: Records repayments or advance payments.
- **Live Net Balance Engine**: Real-time calculation per customer:
  - `Red`: Customer owes money (Net Owed > 0).
  - `Green`: Advance or settled balance (Net Owed ≤ 0).
- **Payment Modes**: Supports Cash, UPI (GPay, PhonePe, Paytm), Cheque, and Direct Bank Transfer.

### 3. 🤖 AI-Powered Smart Features
- **Smart Natural Language Entry**: Merchants can type or speak queries like `"Ramesh took 500 rupees grocery on credit"` or `"Priya paid 200 via UPI"`. The system extracts `{ customerName, amount, type, paymentMode, note }` and pre-fills the entry form automatically!
- **AI Credit Risk Scoring**: Analyzes credit utilization ratios, repayment speeds, and transaction frequency to assign safety ratings (**LOW RISK**, **MEDIUM RISK**, **HIGH RISK**) before extending fresh credit.
- **AI Payment Reminder Generator**: Generates customized, polite, firm, or urgent payment reminders dynamically tailored to the debt amount and shop name, with a **1-Click WhatsApp Trigger** (`https://wa.me/...`).
- **AI Cashflow Advisor**: Evaluates total merchant-wide ledger metrics to provide health diagnostics (Healthy, Moderate, Critical) and actionable recovery recommendations.

### 4. 📄 Export & Audit Trail
- **Downloadable PDF Statement**: Generates instant, clean PDF statements for any customer ledger using Apache PDFBox.
- **Audit Logging**: Persists audit entries for every transaction, merchant registration, and system operation.

---

## 🛠 Tech Stack & System Architecture

| Layer | Technologies Used |
| :--- | :--- |
| **Backend** | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA, Hibernate, Apache PDFBox, JJWT |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide React Icons, Axios, Recharts, React Router |
| **Database** | Cloud-Hosted Aiven MySQL (SSL Connection `sslmode=REQUIRED`) / Local MySQL / H2 |
| **AI Integration** | OpenAI GPT / Gemini REST Integration with Heuristic Fallback Parser |
| **Containerization** | Docker, Multi-Stage Builds (Maven + OpenJDK 17, Node.js + Nginx), Docker Compose |

---

## 📁 Project Directory Layout

```
Digital udhaar khata/
├── backend/
│   ├── src/main/java/com/digitaludhaar/
│   │   ├── config/ (SecurityConfig, CorsConfig)
│   │   ├── controller/ (AuthController, CustomerController, TransactionController, AiController, StatementController)
│   │   ├── dto/ (AuthDTOs, CustomerDTO, TransactionDTO, AiDTOs, DashboardSummaryDTO)
│   │   ├── model/ (Merchant, Customer, Transaction, AuditLog, TransactionType, PaymentMode)
│   │   ├── repository/ (MerchantRepository, CustomerRepository, TransactionRepository, AuditLogRepository)
│   │   ├── security/ (JwtUtils, JwtAuthenticationFilter, UserDetailsImpl, UserDetailsServiceImpl)
│   │   └── service/ (AuthService, CustomerService, TransactionService, AiIntegrationService, PdfStatementService)
│   ├── src/main/resources/ (application.properties)
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── src/
│   │   ├── api/ (axios, authApi, customerApi, transactionApi, aiApi)
│   │   ├── components/ (Navbar, Sidebar, StatCard, SmartNlpBar, AiInsightsWidget, AddTransactionModal, AddCustomerModal, AiReminderModal, CustomerRiskBadge)
│   │   ├── context/ (AuthContext)
│   │   ├── pages/ (LoginPage, RegisterPage, DashboardPage, CustomersPage, CustomerDetailPage)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── tailwind.config.js
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚡ Quick Start & Deployment Guide

### Prerequisites
- Docker & Docker Compose **OR** Java 17 + Node.js 18+

### 1. Environment Configuration
Copy `.env.example` to `.env` and fill in your Aiven Cloud MySQL database credentials or local setup:

```bash
# Database Configuration
DB_HOST=mysql-your-aiven-project.aivencloud.com
DB_PORT=24479
DB_NAME=udhaar_db
DB_USER=avnadmin
DB_PASSWORD=your_aiven_password

# JWT & AI Keys
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
AI_API_KEY=sk-proj-your-openai-or-gemini-key
```

### 2. Run Containerized Stack via Docker Compose

```bash
docker-compose up --build -d
```

- **Frontend App**: Open [http://localhost](http://localhost) in your browser.
- **Backend API**: Running at [http://localhost:8080/api/v1](http://localhost:8080/api/v1).

### 3. Local Development (Without Docker)

#### Run Backend:
```bash
cd backend
mvn spring-boot:run
```

#### Run Frontend:
```bash
cd frontend
npm install
npm run dev
```

---

## 🔗 Key API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new shopkeeper account |
| `POST` | `/api/v1/auth/login` | Authenticate merchant & receive JWT token |
| `GET` | `/api/v1/customers` | Get all customers with net balance & risk badges |
| `POST` | `/api/v1/customers` | Add a new customer profile with credit limit |
| `POST` | `/api/v1/transactions` | Add Give/Receive entry |
| `GET` | `/api/v1/transactions/dashboard-summary` | Get key metrics & recent activity |
| `POST` | `/api/v1/ai/parse-nlp` | Parse natural language entry string into JSON |
| `POST` | `/api/v1/ai/generate-reminder` | Generate AI payment reminder draft with WhatsApp URL |
| `GET` | `/api/v1/ai/risk-assessment/{id}` | Calculate customer credit risk score & safety advice |
| `GET` | `/api/v1/ai/cashflow-insights` | Get merchant cashflow health status & advice |
| `GET` | `/api/v1/statements/customer/{id}/pdf` | Download customer ledger PDF statement |

---

## 🛡 License
This project is licensed under the MIT License - built for production & portfolio demonstration.
