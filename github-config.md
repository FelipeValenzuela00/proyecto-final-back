# GitHub Repository Configuration Guide

## Branch Strategy

Modelo **GitFlow simplificado** adaptado al equipo de 5:

```
main (o master)
  └── develop
        ├── feature/F0-01-setup-repo
        ├── feature/F1-02-oauth-backend
        ├── bugfix/descripcion
        └── hotfix/descripcion   ← solo va directo a main en emergencias
```

**Reglas:**
- `main` y `develop` son ramas protegidas — nadie pushea directo, siempre PR
- `feature/*` se abre desde `develop`, se mergea a `develop`
- `hotfix/*` se abre desde `main`, se mergea a `main` **y** a `develop`
- PR a `main` solo acepta desde `develop` o `hotfix/*`

---

## Branch Protection Rules (GitHub Settings)

Configurar en **Settings > Branches** del repo.

### Para `main`

```
Branch name pattern: main

✅ Require a pull request before merging
    ✅ Require approvals: 1
    ✅ Dismiss stale pull request approvals when new commits are pushed
✅ Require status checks to pass before merging
    Status checks requeridos:
      - ci / lint-and-test
      - security / secret-scan
      - pr-guard / check-source-branch
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
✅ Restrict who can push: (dejar vacío = nadie pushea directo)
```

### Para `develop`

```
Branch name pattern: develop

✅ Require a pull request before merging
    ✅ Require approvals: 1
✅ Require status checks to pass before merging
    Status checks requeridos:
      - ci / lint-and-test
      - security / secret-scan
✅ Require branches to be up to date before merging
✅ Do not allow bypassing the above settings
```

---

## GitHub Actions

Crear los siguientes archivos en `.github/workflows/`.

### `.github/workflows/ci.yml` — Lint + Tests

Se ejecuta en todo PR hacia `develop` o `main`.

```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Run linter
        working-directory: backend
        run: npm run lint

      - name: Run tests
        working-directory: backend
        run: npm test
```

> Ajustar `working-directory` según la estructura del repo.

---

### `.github/workflows/security.yml` — Detección de secretos + CHANGELOG

```yaml
name: Security & Changelog

on:
  pull_request:
    branches: [main, develop]

jobs:
  secret-scan:
    name: Secret Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # necesario para escanear el diff completo

      - name: Detect hardcoded secrets (gitleaks)
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  changelog-check:
    name: CHANGELOG Updated
    runs-on: ubuntu-latest
    # Solo aplica en PRs a main (release-ready)
    if: github.base_ref == 'main'
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check CHANGELOG.md was updated
        run: |
          if ! git diff --name-only origin/${{ github.base_ref }}...HEAD | grep -q "CHANGELOG.md"; then
            echo "❌ Este PR a main no incluye cambios en CHANGELOG.md"
            echo "Agregá una entrada en CHANGELOG.md describiendo los cambios de esta release."
            exit 1
          fi
          echo "✅ CHANGELOG.md actualizado"
```

**Sobre gitleaks:** es open source, no requiere token externo. Detecta patrones de API keys, tokens JWT, Google credentials, etc. Se puede agregar un `.gitleaks.toml` en la raíz para ajustar reglas si hay falsos positivos.

---

### `.github/workflows/pr-guard.yml` — Control de ramas origen hacia `main`

Garantiza que solo `develop` o `hotfix/*` puedan hacer PR a `main`.

```yaml
name: PR Branch Guard

on:
  pull_request:
    branches: [main]

jobs:
  check-source-branch:
    name: Check Source Branch
    runs-on: ubuntu-latest
    steps:
      - name: Validate source branch
        run: |
          SOURCE="${{ github.head_ref }}"
          echo "Source branch: $SOURCE"

          if [[ "$SOURCE" == "develop" || "$SOURCE" == hotfix/* ]]; then
            echo "✅ Branch '$SOURCE' está autorizada para mergear a main"
          else
            echo "❌ Branch '$SOURCE' NO puede hacer PR a main directamente"
            echo ""
            echo "Solo se aceptan PRs a main desde:"
            echo "  - develop"
            echo "  - hotfix/*"
            echo ""
            echo "Si es una feature, primero mergeá a develop."
            exit 1
          fi
```

---

## Archivos a crear en el repo

```
.github/
  workflows/
    ci.yml
    security.yml
    pr-guard.yml
.gitleaks.toml        ← opcional, para afinar detección de secretos
CHANGELOG.md          ← inicializarlo desde el día 1
.env.example          ← template de variables de entorno (sin valores reales)
.gitignore            ← asegurarse que .env nunca se commitee
```

### `CHANGELOG.md` inicial

```markdown
# Changelog

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [0.1.0] - 2026-04-10
### Added
- Initial project setup
```

### `.gitleaks.toml` mínimo

```toml
title = "TimeTracker Gitleaks Config"

[extend]
useDefault = true   # usa todas las reglas built-in de gitleaks

[[rules]]
description = "Ignorar placeholders en .env.example"
id = "env-example-ignore"
path = '''.env\.example'''
allowlist = { regexes = [".*"] }
```

---

## Buenas Prácticas — Reglas del Equipo

### Branches

1. **Nunca pushear directo a `main` ni `develop`** — siempre PR
2. **Nombres de branches con prefijo:** `feature/`, `bugfix/`, `hotfix/`, `chore/`, `docs/`
3. **Una branch por tarea F-XX:** `feature/F1-02-oauth-backend`
4. **No acumular branches más de 3 semanas** sin mergear a `develop` — evita conflictos grandes

### Pull Requests

5. **Todo PR necesita al menos 1 reviewer** antes de mergear
6. **El autor no aprueba su propio PR**
7. **PR a `main` solo desde `develop` o `hotfix/*`** — el workflow lo bloquea automáticamente
8. **Actualizar `CHANGELOG.md` en todo PR a `main`**

### Secretos y Seguridad

9. **Nunca commitear `.env`** — usar `.env.example` como template sin valores reales
10. **API keys, tokens y passwords siempre en variables de entorno** — nunca hardcodeados
11. **Google OAuth credentials solo en variables de entorno** — ni en comentarios ni en strings de código
12. **Si gitleaks falla en tu PR, es un bloqueante** — no se puede mergear hasta resolverlo

### Código

13. **`shared/` es zona coordinada** — cambios en middleware, database o config requieren PR con review del equipo
14. **Cada módulo trabaja en su carpeta** — `modules/auth/`, `modules/google/`, etc.
15. **Commit messages en inglés, descriptivos** — `feat: add OAuth callback endpoint`, no `fix stuff`

---

## Convención de Commit Messages (Conventional Commits)

| Prefijo | Uso |
|---|---|
| `feat:` | nueva funcionalidad |
| `fix:` | bug fix |
| `chore:` | tareas de mantenimiento (deps, config) |
| `docs:` | solo documentación |
| `test:` | solo tests |
| `refactor:` | refactor sin cambio funcional |

Referencia: [conventionalcommits.org](https://www.conventionalcommits.org/)

---

## Resumen Visual del Flujo

```
feature/F1-02 ──PR──→ develop ──PR──→ main
hotfix/fix-auth ──────────────PR──→ main
                               ↑
                     (solo develop o hotfix/*)
                     
```

| Workflow | Se ejecuta cuando | Bloquea si... |
|---|---|---|
| `ci.yml` | PR a `develop` o `main` | lint falla o tests fallan |
| `security.yml` | PR a `develop` o `main` | hay secretos hardcodeados, o PR a main sin CHANGELOG |
| `pr-guard.yml` | PR a `main` | la rama origen no es `develop` ni `hotfix/*` |
