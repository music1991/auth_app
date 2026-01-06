# Teams Improve

**Teams Improve** is a work-in-progress web application built with **Next.js** and focused on improving team performance through KPIs and task management.

The project applies modern full-stack best practices, including secure authentication, scalable architecture, and environment-based deployments.

---

## Overview

Teams Improve aims to help teams track key performance indicators, manage tasks, and improve collaboration using a structured and data-driven approach.

The application leverages **Next.js App Router** for routing, server-side logic, and middleware, providing a solid foundation for future feature growth.

---

## Current Features

- User registration with email verification code (with resend and expiration)  
- Secure login with hashed passwords using bcryptjs  
- Session management with JWT stored in httpOnly cookies  
- Route protection using Next.js middleware  
- Logout and navigation protection for authenticated pages  

---

## Planned Features

- Team and user management  
- KPI creation, tracking, and visualization  
- Task assignment and progress tracking  
- Real API data fetching (replacing mocked data)  
- Completed and refined UI/UX  

---

## Tech Stack

- Next.js  
- React  
- TypeScript  
- Tailwind CSS  
- PostgreSQL (Neon)  
- Vercel (deployment & environment management)  
- Resend (email verification emails)  

---

## Architecture & Best Practices

- Clear separation of concerns between API routes and UI components  
- Secure authentication and session handling  
- httpOnly cookies with `sameSite=lax`  
- Cache prevention using `force-dynamic` and `no-store`  
- Environment-based configuration (development and production)  
- Reusable UI components (e.g. countdown timers)  
- Clear user feedback via toasts and visual indicators  

---

## Environment Setup

Each deployment environment is connected to a dedicated branch:

- **dev** – Development environment  
- **main** – Production environment  

This approach allows safe testing and development without impacting production data, while maintaining consistent schema and migrations across environments.

---

## Development Status

This project is **actively in development**.

- Visual design is partially implemented  
- Data fetching logic currently relies on mocked data  
- API integration and core business logic are still in progress  

---

## Getting Started

### Prerequisites

- Node.js (latest LTS recommended)
- npm or yarn

### Installation

```bash
npm install