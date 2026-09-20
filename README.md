# MoveWell Physiotherapy AI Chatbot

An AI-powered conversational assistant for physiotherapy clinics, designed to provide clinic information, answer patient questions using a knowledge base, check appointment availability, create appointment requests, find existing appointments, and process appointment cancellations.

The project is designed with a **reusable architecture** so the same foundation can be adapted for future healthcare and clinic clients with different doctors, services, schedules, and clinic information.

---

## Overview

The MoveWell Physiotherapy AI Chatbot provides patients with a conversational interface for interacting with a physiotherapy clinic.

The assistant can:

- Answer questions about the clinic
- Explain available physiotherapy services
- Provide therapist information
- Retrieve information from the clinic knowledge base
- Check doctor availability
- Suggest available appointment slots
- Create appointment requests
- Find existing appointments
- Cancel appointments securely
- Handle multiple doctors and different schedules
- Prevent duplicate bookings
- Handle date and time requests
- Provide medical safety guidance
- Refuse unsupported or unknown medical information
- Maintain a professional and patient-friendly conversation

The chatbot is currently configured with fictional **MoveWell Physiotherapy Clinic** data for demonstration and development purposes.

---

## Key Features

### AI-Powered Chat

Patients can interact naturally with the assistant using conversational language.

Examples:

- "What services do you offer?"
- "Do you have a physiotherapist for back pain?"
- "Is Sophie available tomorrow?"
- "I want to book an appointment."
- "Can I cancel my appointment?"
- "What are your opening hours?"

The AI determines the user's intent and uses the appropriate backend functionality when necessary.

---

### RAG Knowledge Search

The chatbot uses **Retrieval-Augmented Generation (RAG)** to retrieve relevant information from the clinic's knowledge base.

The knowledge base can contain:

- Clinic information
- Services
- Therapist information
- Appointment procedures
- Medical safety information
- Physiotherapy educational information
- Other clinic-specific content

The retrieved information is provided to the AI model so that responses are grounded in the clinic's configured knowledge.

---

### Appointment Availability

The chatbot can check real appointment availability using the database.

Patients can request availability for a specific therapist and date.

Example:

> "Is Dr. Sophie Martin available on September 9?"

The system checks the therapist's schedule and existing appointments before returning available slots.

---

### Appointment Booking

Patients can request an appointment directly through the chatbot.

The booking process collects:

- Patient name
- Phone number
- Email address
- Doctor/therapist
- Service
- Appointment date
- Appointment time
- Reason for visit

Before creating an appointment, the system performs an availability check to reduce the possibility of double booking.

New appointments are created with a `pending` status.

The clinic can then confirm the appointment.

---

### Appointment Lookup

Patients can find their existing appointments by providing:

- Email address
- Phone number

The system retrieves matching appointments and provides information such as:

- Appointment ID
- Date
- Time
- Doctor
- Service
- Appointment status

---

### Appointment Cancellation

Patients can cancel an appointment by providing their appointment ID and verifying their:

- Email address
- Phone number

The system verifies the provided information before allowing the cancellation.

Already cancelled or completed appointments cannot be cancelled again.

---

### Double-Booking Protection

The database includes protection against duplicate bookings for the same doctor, date, and time.

This is enforced at the database level using a unique index.

This provides an additional layer of protection even if multiple requests attempt to book the same slot simultaneously.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | Full-stack application framework |
| TypeScript | Type-safe development |
| React | User interface |
| Tailwind CSS | Styling |
| shadcn/ui | UI components |
| Lucide | Icons |
| Vercel AI SDK | AI integration and streaming |
| OpenAI | Large language model |
| Supabase | Database and backend infrastructure |
| PostgreSQL | Relational database |
| pgvector | Vector similarity search |
| HNSW | Vector search indexing |
| Vercel | Production deployment |

---

# Architecture

The application follows a reusable AI-agent architecture.

```text
                         ┌──────────────────────┐
                         │      Patient         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Chat Interface     │
                         │      Next.js         │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │     AI SDK / API     │
                         │      Route Handler   │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    │               │                │
                    ▼               ▼                ▼
             ┌────────────┐ ┌──────────────┐ ┌──────────────┐
             │   OpenAI   │ │ RAG Search   │ │ AI Tools     │
             │    Model   │ │  pgvector    │ │ Appointments │
             └────────────┘ └──────┬───────┘ └──────┬───────┘
                                    │                │
                                    ▼                ▼
                              ┌─────────────────────────┐
                              │        Supabase         │
                              │      PostgreSQL         │
                              │                         │
                              │ Clinics                 │
                              │ Doctors                 │
                              │ Services                │
                              │ Schedules               │
                              │ Patients                │
                              │ Appointments            │
                              │ Documents + Embeddings  │
                              └─────────────────────────┘
```

---

## AI Architecture

The AI layer is responsible for understanding the patient's request and determining whether it can answer directly or needs to use backend tools.

### Main AI Components

```text
Patient Message
      │
      ▼
AI Model
      │
      ├── General Clinic Question
      │       │
      │       ▼
      │   Knowledge Search
      │
      ├── Availability Request
      │       │
      │       ▼
      │   getAvailability
      │
      ├── Booking Request
      │       │
      │       ▼
      │   createAppointment
      │
      ├── Appointment Lookup
      │       │
      │       ▼
      │   findAppointments
      │
      └── Cancellation Request
              │
              ▼
        cancelAppointment
```

---

# Project Structure

```text
movewell-chatbot/
│
├── public/
│
├── src/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   └── ui/
│   │
│   ├── lib/
│   │   │
│   │   ├── ai/
│   │   │   └── tools/
│   │   │       ├── get-availability.ts
│   │   │       ├── create-appointment.ts
│   │   │       ├── find-appointments.ts
│   │   │       └── cancel-appointment.ts
│   │   │
│   │   ├── clinic/
│   │   │   ├── config.ts
│   │   │   └── content.ts
│   │   │
│   │   ├── knowledge/
│   │   │   ├── ingest.ts
│   │   │   └── search.ts
│   │   │
│   │   ├── supabase.ts
│   │   └── supabase-admin.ts
│   │
│   └── ...
│
├── .env.local
├── .gitignore
├── package.json
├── README.md
├── tsconfig.json
└── next.config.ts
```

---

# Clinic Configuration

Clinic-specific information is separated from the main AI architecture.

This makes it easier to reuse the application for another clinic.

The current configuration contains:

- Clinic name
- Location
- Phone number
- Email address
- Opening hours
- Services
- Therapists
- Clinic-specific information

The AI prompt uses this configuration instead of duplicating clinic information throughout the application.

---

## Current Demo Clinic

### MoveWell Physiotherapy Clinic

**Location:** Mulhouse, France

**Phone:** +33 3 89 00 00 00

**Email:** contact@movewell-demo.fr

### Opening Hours

| Day | Hours |
|---|---|
| Monday | 08:00 – 19:00 |
| Tuesday | 08:00 – 19:00 |
| Wednesday | 08:00 – 19:00 |
| Thursday | 08:00 – 19:00 |
| Friday | 08:00 – 19:00 |
| Saturday | 09:00 – 13:00 |
| Sunday | Closed |

> **Note:** The current clinic information is fictional and intended only for development and demonstration.

---

## Services

The current demo clinic contains the following services:

1. General Physiotherapy
2. Back & Neck Pain
3. Sports Rehabilitation
4. Post-Surgery Rehabilitation
5. Therapeutic Exercise
6. Mobility & Injury Prevention

---

## Therapists

### Dr. Sophie Martin

**Specialization:**

- Musculoskeletal physiotherapy
- Back and neck rehabilitation

**Availability:**

Monday – Friday

---

### Thomas Bernard

**Specialization:**

- Sports rehabilitation
- Injury prevention

**Availability:**

Monday, Wednesday, Friday

---

# Database

The application uses **Supabase PostgreSQL** as the primary database.

The database contains structured data for the clinic and appointment system.

---

## Main Tables

### `clinics`

Stores clinic information.

| Field | Description |
|---|---|
| `id` | Clinic identifier |
| `name` | Clinic name |
| `phone` | Clinic phone number |
| `email` | Clinic email |
| `address` | Clinic address |
| `timezone` | Clinic timezone |
| `created_at` | Creation timestamp |

---

### `doctors`

Stores therapist/doctor information.

| Field | Description |
|---|---|
| `id` | Doctor identifier |
| `clinic_id` | Associated clinic |
| `name` | Doctor name |
| `specialization` | Medical specialization |
| `bio` | Doctor biography |
| `active` | Active status |
| `created_at` | Creation timestamp |

---

### `services`

Stores available clinic services.

| Field | Description |
|---|---|
| `id` | Service identifier |
| `clinic_id` | Associated clinic |
| `name` | Service name |
| `description` | Service description |
| `active` | Active status |
| `created_at` | Creation timestamp |

---

### `doctor_schedules`

Stores doctor availability and working schedules.

The schedule system allows different doctors to have different working days and hours.

---

### `patients`

Stores patient information required for appointment management.

---

### `appointments`

Stores appointment requests and their status.

Important fields include:

| Field | Description |
|---|---|
| `id` | Appointment identifier |
| `clinic_id` | Associated clinic |
| `doctor_id` | Associated doctor |
| `service_id` | Associated service |
| `patient_id` | Associated patient |
| `appointment_date` | Appointment date |
| `start_time` | Appointment start time |
| `duration_minutes` | Appointment duration |
| `reason` | Reason for appointment |
| `status` | Appointment status |
| `created_at` | Creation timestamp |

---

### `documents`

Stores the clinic knowledge base and vector embeddings.

| Field | Description |
|---|---|
| `id` | Document identifier |
| `content` | Knowledge base content |
| `metadata` | Document metadata |
| `embedding` | Vector embedding |
| `created_at` | Creation timestamp |

---

# Appointment Status

Appointments currently support the following statuses:

```text
pending
confirmed
cancelled
completed
```

### Pending

The appointment request has been created but has not yet been confirmed by the clinic.

### Confirmed

The clinic has confirmed the appointment.

### Cancelled

The appointment has been cancelled.

### Completed

The appointment has already taken place.

---

# Appointment Workflow

The booking workflow follows this process:

```text
Patient requests appointment
          │
          ▼
AI collects required information
          │
          ▼
Check doctor/service
          │
          ▼
Check date and time
          │
          ▼
Check availability
          │
          ▼
Create patient if required
          │
          ▼
Create appointment
          │
          ▼
Appointment status = pending
          │
          ▼
Clinic confirms appointment
```

---

# AI Tools

The chatbot currently exposes four main appointment tools.

---

## `getAvailability`

Checks available appointment slots for a specific doctor and date.

### Inputs

```text
doctorName
date
slotDurationMinutes
```

### Responsibilities

- Resolve the doctor
- Verify that the doctor exists
- Check the doctor's schedule
- Check existing appointments
- Generate available slots
- Return available appointment times

---

## `createAppointment`

Creates a new appointment request.

### Inputs

```text
doctorName
serviceName
date
startTime
durationMinutes
reason
name
phone
email
```

### Responsibilities

- Resolve doctor
- Resolve service
- Validate date
- Validate time
- Verify availability
- Find or create patient
- Create appointment
- Handle duplicate booking conflicts
- Return appointment details

The appointment is initially created with:

```text
status = pending
```

---

## `findAppointments`

Finds appointments belonging to a patient.

### Inputs

```text
email
phone
```

### Responsibilities

- Normalize contact information
- Find the patient
- Verify matching contact details
- Retrieve appointments
- Return doctor and service information

---

## `cancelAppointment`

Cancels an existing appointment.

### Inputs

```text
appointmentId
email
phone
```

### Responsibilities

- Find the appointment
- Verify patient identity
- Check appointment status
- Prevent invalid cancellation
- Update the appointment status to `cancelled`

---

# RAG Knowledge System

The chatbot uses **Retrieval-Augmented Generation (RAG)** to provide grounded responses from the clinic's knowledge base.

---

## Embedding Model

The project currently uses:

```text
text-embedding-3-small
```

with:

```text
1536 dimensions
```

---

## Vector Database

Supabase PostgreSQL is used together with the `pgvector` extension.

The `documents.embedding` column stores vector embeddings.

An **HNSW index** is used for efficient similarity search.

---

## Knowledge Search Flow

```text
Patient Question
       │
       ▼
Generate Query Embedding
       │
       ▼
Supabase pgvector Search
       │
       ▼
Retrieve Relevant Documents
       │
       ▼
Add Context to AI Prompt
       │
       ▼
Generate Grounded Response
```

---

# Knowledge Base Content

The current demo knowledge base contains information about:

- Clinic information
- Clinic services
- Individual services
- Therapists
- Appointment procedures
- Medical safety
- Physiotherapy information

The knowledge base can be expanded without changing the core chatbot architecture.

---

# Date and Time Handling

The chatbot handles natural-language date requests such as:

- Today
- Tomorrow
- Specific dates
- Days of the week

The clinic timezone is configured as:

```text
Europe/Paris
```

The AI is instructed to interpret relative dates according to the clinic's timezone.

The system also prevents booking appointments in the past.

---

# Scheduling System

Each doctor can have an independent schedule.

For example:

```text
Dr. Sophie Martin
Monday – Friday
08:00 – 19:00
```

and:

```text
Thomas Bernard
Monday / Wednesday / Friday
08:00 – 19:00
```

This allows the architecture to support multiple therapists with different availability.

---

# Multiple Doctors

The system is designed to support multiple doctors within the same clinic.

The database relationship is:

```text
Clinic
  │
  ├── Doctor 1
  │      └── Schedule
  │
  ├── Doctor 2
  │      └── Schedule
  │
  └── Doctor N
         └── Schedule
```

Appointments are associated with a specific doctor.

Therefore, two different doctors can have appointments at the same time without conflicting with each other.

---

# Double-Booking Protection

The application uses a database-level unique index to prevent duplicate bookings for the same doctor, date, and start time.

Conceptually:

```text
Doctor + Date + Start Time
```

must be unique for active appointments.

Active appointment statuses include:

```text
pending
confirmed
```

This protects the application against duplicate booking attempts.

---

# Medical Safety

The chatbot is not intended to replace a qualified healthcare professional.

The AI is instructed to:

- Avoid diagnosing patients
- Avoid claiming certainty about medical conditions
- Avoid prescribing medication
- Avoid providing unsafe medical instructions
- Encourage professional medical evaluation when appropriate
- Recommend urgent medical care for emergencies
- Clearly communicate that the chatbot provides general information only

The system should not be treated as a medical diagnostic tool.

---

# Conversation Behavior

The assistant is designed to communicate in a professional, concise, and patient-friendly manner.

The AI should:

- Answer directly
- Ask only necessary follow-up questions
- Avoid unnecessary repetition
- Use clinic-specific information when available
- Use tools when real-time appointment information is required
- Avoid inventing unavailable information
- Clearly state when information is unavailable
- Keep appointment conversations structured

---

# Unknown Information

If the requested information is not available in the clinic knowledge base or application data, the chatbot should not fabricate an answer.

Instead, it should clearly explain that the information is not available and direct the patient to contact the clinic when appropriate.

---

# Error Handling

The application handles several possible errors.

Examples include:

- Doctor not found
- Multiple doctors with the same name
- Service not found
- Invalid date
- Invalid time
- Past appointment date
- Doctor unavailable
- Clinic closed
- Invalid email
- Invalid phone number
- Appointment not found
- Incorrect cancellation credentials
- Already cancelled appointment
- Completed appointment
- Duplicate booking
- Database errors

The AI should communicate these errors in a user-friendly way rather than exposing internal database or implementation details.

---

# Validation

Input validation is performed before appointment-related operations.

The system validates:

- Doctor name
- Service name
- Date
- Time
- Appointment duration
- Patient name
- Phone number
- Email address
- Appointment ID

The system also re-checks appointment availability immediately before creating a booking.

---

# Security

Security is an important part of the architecture.

---

## Environment Variables

Sensitive credentials are stored in environment variables.

The following values are used:

```env
OPENAI_API_KEY=...

NEXT_PUBLIC_SUPABASE_URL=...

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...

SUPABASE_SECRET_KEY=...
```

---

## Server-Side Secrets

The Supabase secret key is used only on the server side.

It must never be exposed to:

- Browser JavaScript
- Client components
- Public API responses
- Git repositories
- Frontend environment variables

---

## OpenAI API Key

The OpenAI API key is also kept server-side.

It should never be exposed to the client.

---

## Environment Files

`.env.local` should never be committed to Git.

The `.gitignore` file should protect environment files.

---

# Installation

## Prerequisites

Install or configure:

- Node.js
- npm
- Supabase project
- OpenAI API key

---

## Clone the Project

```bash
git clone <repository-url>
cd movewell-chatbot
```

---

## Install Dependencies

```bash
npm install
```

---

## Configure Environment Variables

Create:

```text
.env.local
```

Add:

```env
OPENAI_API_KEY=your_openai_api_key

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key

SUPABASE_SECRET_KEY=your_supabase_secret_key
```

> **Important:** Never commit these values to the repository.

---

# Supabase Setup

Create a Supabase project and enable the `pgvector` extension.

The database requires the following main tables:

```text
clinics
doctors
services
doctor_schedules
patients
appointments
documents
```

The vector search system also requires:

```text
pgvector
```

and an HNSW vector index.

---

# Knowledge Ingestion

The project includes a knowledge ingestion process for inserting clinic content into the vector database.

The ingestion process:

```text
Clinic Content
      │
      ▼
Generate Embeddings
      │
      ▼
text-embedding-3-small
      │
      ▼
1536-dimensional Vector
      │
      ▼
Supabase documents table
```

After ingestion, the chatbot can retrieve relevant information through vector similarity search.

---

# Development

Start the development server:

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

---

# Production Build

Before deployment, run:

```bash
npm run build
```

If the build succeeds, the application is ready for production deployment preparation.

---

# Production Start

After building:

```bash
npm start
```

---

# Testing and Validation

The MVP has been tested across the main chatbot workflows.

---

## RAG

Tested:

- Knowledge retrieval
- Clinic information
- Services
- Therapist information
- Physiotherapy information

---

## Appointments

Tested:

- Availability checking
- Appointment creation
- Appointment lookup
- Appointment cancellation
- Duplicate booking protection

---

## Date Handling

Tested:

- Today
- Tomorrow
- Past dates
- Closed days
- Doctor working days

---

## Validation

Tested:

- Invalid email
- Invalid phone number
- Invalid appointment information
- Invalid doctor
- Invalid service

---

## Security

Tested:

- Prompt injection attempts
- Tool injection attempts
- Secret-key exposure checks
- Environment variable protection

---

## Safety

Tested:

- Medical diagnosis requests
- Unsupported medical services
- Unsafe medical requests
- Emergency-related situations

---

# Reusable Architecture

One of the main goals of the project is to create an architecture that can be reused for future clients.

The architecture separates **core AI infrastructure** from **clinic-specific configuration**.

---

## Core AI Infrastructure

The reusable infrastructure includes:

- AI model
- AI SDK
- AI tools
- RAG
- Database integration
- Validation
- Appointment logic

---

## Clinic-Specific Configuration

Clinic-specific information includes:

- Clinic name
- Clinic location
- Clinic contact details
- Opening hours
- Doctors
- Services
- Knowledge base
- Schedules

This makes it possible to adapt the application to another clinic without rebuilding the entire AI system.

---

# Future Client Adaptation

For a new clinic, the following information can be changed:

```text
Clinic
 ├── Name
 ├── Location
 ├── Contact information
 ├── Opening hours
 │
 ├── Doctors
 │    ├── Doctor 1
 │    ├── Doctor 2
 │    └── Doctor N
 │
 ├── Services
 │    ├── Service 1
 │    ├── Service 2
 │    └── Service N
 │
 ├── Doctor schedules
 │
 └── Knowledge base
```

The core AI and appointment architecture can remain the same.

---

# Current Demo Data

The application currently uses fictional demonstration data for:

- MoveWell Physiotherapy Clinic
- Doctors
- Services
- Patient records
- Appointments
- Knowledge base content

This data must be replaced with real client information before production use.

---

# Production Considerations

The current implementation is an MVP and should receive additional hardening before handling real patient data.

Recommended production improvements include:

- Production-grade authentication
- Proper user authorization
- Stronger patient identity matching
- Privacy and data protection controls
- Audit logging
- Monitoring and alerting
- Rate limiting
- Improved appointment conflict handling
- More robust overlapping-duration protection
- Upcoming-appointment filtering
- Appointment confirmation workflows
- Admin/clinic dashboard
- Production database policies
- Backup and recovery procedures
- Error monitoring
- Secure production environment configuration

---

# Patient Data and Privacy

The current project uses fictional demo data.

Before using the system with real patients, the application should be reviewed for:

- Data protection requirements
- Healthcare privacy requirements
- Appropriate database access controls
- Data retention policies
- Secure authentication
- Logging policies
- Encryption
- Consent requirements
- Applicable local regulations

The chatbot should not be deployed with real patient information until the required security and privacy controls have been implemented and reviewed.

---

# OpenAI Configuration

The current development environment uses an OpenAI model through the Vercel AI SDK.

The model is configured in the server-side chat route.

Before production deployment, the project should use a **MadVisions-controlled OpenAI project and API key** rather than a personal development key.

---

# Deployment

The application is designed to be deployed using Vercel.

Basic deployment flow:

```text
Git Repository
      │
      ▼
Vercel
      │
      ├── Next.js Application
      │
      ├── Environment Variables
      │
      └── Production Deployment
               │
               ▼
           Supabase
               │
               ├── PostgreSQL
               ├── pgvector
               └── Appointment Data
```

---

# Deployment Checklist

Before production deployment:

- [ ] Configure production environment variables
- [ ] Use MadVisions-controlled OpenAI credentials
- [ ] Configure production Supabase project
- [ ] Verify database schema
- [ ] Verify vector search
- [ ] Ingest production clinic knowledge
- [ ] Add production doctors
- [ ] Add production services
- [ ] Configure doctor schedules
- [ ] Verify appointment booking
- [ ] Verify cancellation
- [ ] Verify duplicate booking protection
- [ ] Test medical safety responses
- [ ] Test prompt injection protection
- [ ] Test authentication and authorization
- [ ] Configure monitoring
- [ ] Configure backups
- [ ] Review privacy and data protection requirements
- [ ] Run production build

---

# Development Workflow

Recommended development workflow:

```text
1. Update clinic configuration
        │
        ▼
2. Update database data
        │
        ▼
3. Update knowledge base
        │
        ▼
4. Test AI behavior
        │
        ▼
5. Test appointment tools
        │
        ▼
6. Run production build
        │
        ▼
7. Review security
        │
        ▼
8. Deploy
```

---

# MVP Status

The current MVP includes:

- [x] Next.js application
- [x] TypeScript
- [x] Modern chatbot UI
- [x] AI-powered conversations
- [x] OpenAI integration
- [x] Vercel AI SDK
- [x] Supabase integration
- [x] PostgreSQL database
- [x] pgvector
- [x] RAG knowledge search
- [x] Clinic configuration
- [x] Multiple doctors
- [x] Doctor schedules
- [x] Service management
- [x] Availability checking
- [x] Appointment creation
- [x] Appointment lookup
- [x] Appointment cancellation
- [x] Double-booking protection
- [x] Date validation
- [x] Input validation
- [x] Medical safety behavior
- [x] Prompt injection testing
- [x] Security checks
- [x] Production build validation

---

# Known MVP Limitations

The following items are intentionally left for future production hardening.

---

## Patient Matching

The current appointment creation flow primarily uses email-based patient lookup.

A more robust production implementation should use stronger identity matching and validation.

---

## Appointment Overlap

The current system protects the same doctor/date/start-time combination.

For appointments with arbitrary durations, a more advanced database-level time-range exclusion strategy could provide stronger overlap protection.

---

## Appointment Filtering

The appointment lookup functionality can be further improved to prioritize active and upcoming appointments.

---

## Multi-Tenant Architecture

The current architecture is reusable at the application level.

A future full multi-tenant implementation could move clinic configuration completely into database-driven tenant context so multiple independent clinics can operate from the same deployed system.

---

# License

This project is developed for MadVisions and is intended for internal development, demonstration, and client-project use.

Unauthorized redistribution, reuse, or commercial deployment should follow the applicable MadVisions agreements and project requirements.

---

# Project Summary

MoveWell Physiotherapy AI Chatbot is a reusable AI-agent MVP designed to demonstrate how an AI assistant can combine:

```text
Generative AI
      +
RAG
      +
Structured Database
      +
AI Tools
      +
Appointment Management
      +
Clinic Knowledge
```

into a single conversational patient experience.

The architecture is intentionally structured so that the same foundation can be extended and adapted for future clinic and healthcare-related client projects.