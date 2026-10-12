# Production-Ready NestJS RAG System (pgvector + Google Gemini / OpenAI)

A modular, production-ready **Retrieval-Augmented Generation (RAG)** pipeline built with **NestJS**, **Clean Architecture**, **PostgreSQL (pgvector)**, and **TypeORM**, featuring dual support for **Google AI Studio (Gemini)** and **OpenAI**.

---

## 🏛️ Architecture & Clean Architecture Design

This project strictly adheres to **Clean Architecture / Hexagonal Principles**:

```
src/
├── config/                 # Environment validation (class-validator) & TypeORM config
├── common/                 # Global exception filters & logging interceptors
└── modules/
    ├── document/           # Document ingestion, parsing & chunking
    │   ├── domain/         # Parsed document & text chunk interfaces
    │   ├── application/    # Ingestion service, text splitter, document parser
    │   └── infrastructure/ # DocumentController (multipart/form-data upload)
    ├── vector/             # Vector storage, embeddings & similarity search
    │   ├── domain/         # IEmbeddingProvider, IDocumentChunkRepository
    │   ├── application/    # EmbeddingService, VectorSearchService
    │   └── infrastructure/ # TypeORM entities, pgvector HNSW index, Gemini & OpenAI providers
    └── rag/                # End-user Q&A orchestration
        ├── domain/         # ILlmChatProvider interface
        ├── dto/            # AskQuestionDto, AskQuestionResponseDto
        ├── rag.service.ts  # Prompt augmentation, context retrieval, LLM call
        └── rag.controller.ts
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **Docker & Docker Compose** (for PostgreSQL with `pgvector`)
- A **Google AI Studio API Key** (Gemini) or **OpenAI API Key**

---

### 2. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

#### Option A: Cloud Database (Neon / Supabase / Render / Railway)
Simply set `DATABASE_URL` with SSL enabled:
```env
PORT=8000
DATABASE_URL="postgresql://user:password@ep-sample-pooler.c-6.us-east-2.aws.neon.tech/rag_db?sslmode=require"
DB_SYNCHRONIZE=true

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_CHAT_MODEL=gemini-3.8-flash
VECTOR_DIMENSION=768
```

#### Option B: Local Docker PostgreSQL
```env
PORT=8000
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=rag_db
DB_SYNCHRONIZE=true

AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_CHAT_MODEL=gemini-3.8-flash
VECTOR_DIMENSION=768
```

---

### 3. Start PostgreSQL with pgvector

Start the official PostgreSQL container with the `pgvector` extension enabled:

```bash
docker compose up -d
```

> **Note:** The `docker/init.sql` script automatically enables `CREATE EXTENSION IF NOT EXISTS vector;` on container startup. Additionally, the NestJS application verifies and creates the table and HNSW index on startup.

---

### 4. Install Dependencies & Run Application

```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev
```

The application will start on: **`http://localhost:3000`**

---

## 📡 API Endpoints & cURL Examples

### 1. Ingest Document (PDF or Text)
Extracts text, splits it into overlapping chunks (default 800 chars, 100 overlap), calculates vector embeddings, and persists them into PostgreSQL with pgvector.

- **Endpoint:** `POST /api/documents/upload`
- **Content-Type:** `multipart/form-data`
- **Supported Formats:** `.pdf`, `.txt`, `.md`, `.json`, `.csv`

#### cURL Example:
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@/path/to/your/document.pdf"
```

#### Response (201 Created):
```json
{
  "documentName": "document.pdf",
  "totalChunks": 12,
  "message": "Document successfully ingested and indexed."
}
```

---

### 2. Ask Question (RAG Pipeline)
Performs vector similarity search using PostgreSQL's cosine distance operator (`<=>`) and HNSW index, builds an augmented prompt with retrieved chunks, and asks the LLM.

- **Endpoint:** `POST /api/rag/ask`
- **Content-Type:** `application/json`

#### cURL Example:
```bash
curl -X POST http://localhost:3000/api/rag/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What are the main requirements of the project?",
    "topK": 4
  }'
```

#### Response (200 OK):
```json
{
  "question": "What are the main requirements of the project?",
  "answer": "Based on the provided documents, the main requirements include...",
  "sources": [
    {
      "id": "e0b969d7-8e62-4fc8-9f1c-77d0a256a422",
      "documentName": "document.pdf",
      "chunkIndex": 2,
      "content": "Relevant text extracted from the document...",
      "distance": 0.1824,
      "similarityScore": 0.8176
    }
  ],
  "modelUsed": "gemini-1.5-flash",
  "timestamp": "2026-10-11T22:50:00.000Z"
}
```

---

## 🧪 Testing Vector Distance & HNSW Index

The application creates an HNSW index on `document_chunks(embedding)` using `vector_cosine_ops`:

```sql
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops);
```

Similarity queries use the `<=>` cosine distance operator:
```sql
SELECT id, document_name, content, chunk_index,
       (embedding <=> $1::vector) AS distance
FROM document_chunks
ORDER BY distance ASC
LIMIT 4;
```
