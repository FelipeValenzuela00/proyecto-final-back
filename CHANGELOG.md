# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.2.0] - 2026-05-02

### Added
- Express app setup with `src/app.js` and `src/server.js` (singleton pattern, graceful shutdown on SIGINT/SIGTERM)
- Modular project structure under `src/modules/` with scaffolded stubs for admin, ai, auth, google, and reports modules
- Prisma ORM with PostgreSQL: schema defining `User`, `DailyActivity`, and `Report` models with enums `Role` and `ReportStatus`
- Initial database migration (`20260430214657_init`) and seed script with sample employee data
- Shared middleware: `requestLogger` (HTTP access logging, skips `/health`) and `errorHandler` (4xx → warn, 5xx → error, hides internal details from clients)
- CRLF log-injection sanitization utility (`src/shared/utils/sanitize.js`) applied across all middleware logging
- Winston logger with colorized console transport and rotating JSON file transports for `error.log` and `combined.log`
- Jest test suite covering `errorHandler`, `requestLogger`, and `sanitizeForLog`
- Dockerfile using `node:20-slim` with non-root `node` user
- Docker Compose with `app` and `postgres:15` services
- CodeQL workflow for JavaScript/TypeScript security analysis on push and pull requests to `main`/`develop`
- PR description template (`.github/pull_request_template.md`)
- ESLint and Prettier configuration
- `.dockerignore` and `.env.example`

### Changed
- CI workflow updated to run from the repository root (removed `backend/` working-directory prefix)
- Security workflow refactored to install and run gitleaks binary locally instead of using the cloud-licensed action

## [0.1.1] - 2026-04-18

### Added
- Add develop branch

### Removed
- CI check till we have Node configured

### Changed
- Refactor security workflow so that github leaks uses binary local engine and not the cloud licence one.

## [0.1.0] - 2026-04-10

### Added
- Github initial configuration for github rules
