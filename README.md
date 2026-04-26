# Audit Project Management System

Audit Project Management System is a web application for managing audit projects, project structures, users, roles, permissions, evidence, findings, and audit logs.

The system consists of:

- **Backend:** NestJS
- **Frontend:** Next.js
- **Database:** PostgreSQL
- **Database runtime:** Docker container
- **ORM:** Prisma
- **Package manager:** pnpm

This guide explains how to set up and run the project locally on a Windows computer.

---

## Prerequisites

Before running the project, install the following software:

- [Visual Studio Code](https://code.visualstudio.com/download)
- [Git](https://git-scm.com/downloads)
- [Node.js LTS](https://nodejs.org/en/download)
- [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/)

After installing the required software, open **PowerShell**, **Command Prompt**, or the **Visual Studio Code terminal** and verify the installations.

### Check Git

```bash
git --version
```

Expected result:

```text
git version 2.x.x
```

### Check Node.js and npm

```bash
node -v
```

```bash
npm -v
```

Both commands should return version numbers.

### Install pnpm

The project uses `pnpm` as the package manager.

```bash
npm install -g pnpm
```

Check if pnpm was installed successfully:

```bash
pnpm -v
```

### Check Docker

Start **Docker Desktop** before running Docker commands.

```bash
docker -v
```

```bash
docker compose version
```

Both commands should return version numbers.

---

## Project Setup

### 1. Clone the Repository

Choose a folder where you want to store the project. For example, to use the Desktop folder:

```bash
cd Desktop
```

Clone the repository:

```bash
git clone https://github.com/Kristupelis/audit-project-management-system.git
```

Go into the project folder:

```bash
cd audit-project-management-system
```

Check if the files were downloaded:

```bash
dir
```

You should see files and folders such as:

```text
apps
docker
package.json
pnpm-workspace.yaml
README.md
```

You can also check the Git status:

```bash
git status
```

---

### 2. Open the Project in Visual Studio Code

While inside the project folder, run:

```bash
code .
```

If the command does not work, open the project manually:

```text
Visual Studio Code → File → Open Folder → audit-project-management-system
```

Then open a new terminal in Visual Studio Code:

```text
Terminal → New Terminal
```

Make sure the terminal is opened in the root project folder:

```text
audit-project-management-system
```

---

### 3. Install Project Dependencies

From the root project folder, run:

```bash
pnpm install
```

This installs dependencies for the whole project, including:

- `apps/api`
- `apps/web`

After installation, you can check if `node_modules` was created:

```bash
dir node_modules
```

---

## Database Setup

The project uses PostgreSQL running inside a Docker container.

The Docker Compose file is located at:

```text
docker/postgres/docker-compose.yml
```

The database configuration uses:

- PostgreSQL image: `postgres:16`
- Container name: `audit_pms_postgres`
- Database user: `audit`
- Database name: `audit_pms`
- Port mapping: `5432:5432`

### 4. Start the PostgreSQL Container

Make sure Docker Desktop is running.

From the root project folder, run:

```bash
docker compose -f docker/postgres/docker-compose.yml up -d
```

Check if the container is running:

```bash
docker ps
```

You should see a container named:

```text
audit_pms_postgres
```

If the container status is `Up`, the database is running successfully.

---

### 5. Apply Prisma Migrations

The project already includes Prisma migrations, so the database structure can be created automatically.

Go to the backend folder:

```bash
cd apps/api
```

Generate the Prisma client:

```bash
pnpm prisma generate
```

Apply database migrations:

```bash
pnpm prisma migrate dev
```

If Prisma asks for a migration name, you can enter:

```text
init
```

After this step, the PostgreSQL database should contain all required tables.

---

### 6. Optional: Open Prisma Studio

Prisma Studio can be used to inspect and edit the local database.

Make sure you are inside the backend folder:

```text
apps/api
```

Run:

```bash
pnpm prisma studio
```

Prisma Studio should open automatically in your browser.

Default URL:

```text
http://localhost:5555
```

---

## Running the Application

The backend and frontend must be started in separate terminals.

---

### 7. Start the Backend

In the first terminal, go to the backend folder:

```bash
cd apps/api
```

Start the NestJS backend:

```bash
pnpm start:dev
```

If the backend starts successfully, it should run on:

```text
http://localhost:4000
```

Keep this terminal open while using the application.

---

### 8. Start the Frontend

Open a second terminal.

From the project root folder, go to the frontend folder:

```bash
cd apps/web
```

Start the Next.js frontend:

```bash
pnpm dev
```

If the frontend starts successfully, it should run on:

```text
http://localhost:3000
```

Open the application in your browser:

```text
http://localhost:3000
```

---

## First Login and Administrator Access

After the first setup, the database will be empty.

To start using the system:

1. Open the frontend:

```text
http://localhost:3000
```

2. Register a new user account.

3. Open Prisma Studio from the backend folder:

```bash
cd apps/api
pnpm prisma studio
```

4. In Prisma Studio, open the `User` table.

5. Find the user account that you registered.

6. Change the `systemRole` value from:

```text
USER
```

to:

```text
SUPER_ADMIN
```

7. Save the changes.

After this, the selected user will have administrator permissions in the system.

---

## Quick Start Command Summary

After installing Git, Node.js, pnpm, and Docker Desktop, the whole local setup can be done with the following commands.

### Clone the repository

```bash
cd Desktop
git clone https://github.com/Kristupelis/audit-project-management-system.git
cd audit-project-management-system
```

### Install dependencies

```bash
pnpm install
```

### Start the PostgreSQL database

```bash
docker compose -f docker/postgres/docker-compose.yml up -d
```

### Prepare the database

```bash
cd apps/api
pnpm prisma generate
pnpm prisma migrate dev
```

### Start the backend

```bash
pnpm start:dev
```

### Start the frontend

Open a second terminal:

```bash
cd Desktop/audit-project-management-system/apps/web
pnpm dev
```

### Open the application

```text
http://localhost:3000
```

---

## Useful Commands

### Check running Docker containers

```bash
docker ps
```

### Stop the PostgreSQL container

Run this from the root project folder:

```bash
docker compose -f docker/postgres/docker-compose.yml down
```

### Start the PostgreSQL container again

```bash
docker compose -f docker/postgres/docker-compose.yml up -d
```

### Open Prisma Studio

```bash
cd apps/api
pnpm prisma studio
```

### Start backend

```bash
cd apps/api
pnpm start:dev
```

### Start frontend

```bash
cd apps/web
pnpm dev
```

---

## Common Issues

### Git command is not recognized

If this command does not work:

```bash
git --version
```

Git is probably not installed or was not added to the system PATH.

Solution:

1. Install Git from:

```text
https://git-scm.com/downloads
```

2. Restart the terminal.
3. Run again:

```bash
git --version
```

---

### Docker command is not recognized

If this command does not work:

```bash
docker -v
```

Docker Desktop is probably not installed or not running.

Solution:

1. Install Docker Desktop.
2. Open Docker Desktop.
3. Wait until Docker starts.
4. Restart the terminal.
5. Run again:

```bash
docker -v
```

---

### PostgreSQL port 5432 is already in use

If Docker cannot start PostgreSQL because port `5432` is already used, another PostgreSQL instance may already be running on your computer.

Possible solutions:

1. Stop the other PostgreSQL service.
2. Or change the port mapping in:

```text
docker/postgres/docker-compose.yml
```

From:

```yaml
ports:
  - "5432:5432"
```

To:

```yaml
ports:
  - "5433:5432"
```

If you change the port, also update the database connection string in the backend environment configuration.

---

### Backend cannot connect to the database

Check the following:

1. Docker Desktop is running.
2. PostgreSQL container is running:

```bash
docker ps
```

3. The container `audit_pms_postgres` is visible.
4. Prisma migrations were applied:

```bash
cd apps/api
pnpm prisma migrate dev
```

---

### Frontend cannot connect to the backend

Check the following:

1. Backend is running on:

```text
http://localhost:4000
```

2. Frontend is running on:

```text
http://localhost:3000
```

3. The frontend environment configuration points to the correct backend API URL.

---

## Local Project URLs

After successful setup, the system should be available at:

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:4000` |
| Prisma Studio | `http://localhost:5555` |
| PostgreSQL | `localhost:5432` |

---

## Notes

- Keep Docker Desktop running while using the application.
- Keep the backend terminal open.
- Keep the frontend terminal open.
- The project runs locally and is intended for development or testing.
- The database starts empty unless demo data is added manually or through a seed script.
