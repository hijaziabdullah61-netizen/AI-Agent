# Customer Support FAQ AI Agent

A complete Customer Support AI agent built with Spring Boot, PostgreSQL, Ollama (Llama 3), and React.

## Features
- Ask questions in Arabic or English
- AI matches questions to the FAQ database and responds intelligently
- "Escalation" feature if the AI cannot confidently answer
- Admin dashboard to manage FAQs and view escalated questions
- Swagger UI for API documentation

## Requirements
- Java 17+
- PostgreSQL
- Ollama (running locally with `llama3` model)
- Node.js (for React frontend)

## Setup Instructions

### 1. Database & AI Setup
1. Create a PostgreSQL database named `faq_agent_db`.
2. Update `src/main/resources/application.yml` with your PostgreSQL password.
3. Start Ollama: `ollama run llama3` (keep it running).

### 2. Backend Setup
Run the Spring Boot application:
```bash
./mvnw spring-boot:run
```
The backend will run on `http://localhost:8080`.
Swagger documentation is available at `http://localhost:8080/swagger-ui.html`.

### 3. Frontend Setup
Navigate to the `frontend` folder:
```bash
cd ../frontend
npm install
npm run dev
```
The React app will run on `http://localhost:5173`.
