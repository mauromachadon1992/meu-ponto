# Meu Ponto - AI Coding Agent Instructions

## Project Overview
**Meu Ponto** is a time tracking system for employee clock-in/out management with Brazilian labor law compliance. Built as a **fullstack monorepo** with Angular 20+ frontend and Bun + Elysia.js backend, using Prisma ORM with PostgreSQL.

## Architecture

### Stack
- **Frontend**: Angular 20 (standalone components, signals, computed)
- **Backend**: Elysia.js (running on Bun)
- **Database**: PostgreSQL + Prisma ORM
- **UI Library**: Spartan UI (shadcn-style components for Angular)
- **Styling**: Tailwind CSS

### Monorepo Structure
```
src/app/          # Angular frontend
  ├── core/       # Guards, models, services (singleton business logic)
  ├── features/   # Feature modules (admin, auth, registro-ponto, fechamento-ponto)
  └── shared/     # Shared components
server/           # Elysia.js backend
  ├── index.ts    # API routes
  └── lib/        # Server utilities (prisma client, config helpers)
prisma/           # Database schema + migrations + seed
libs/ui/          # Spartan UI components (imported as @spartan-ng/helm/*)
scripts/          # Utility scripts (init-production.ts, etc)
```

## Critical Patterns

### 1. Angular Modern Practices
- **Always use standalone components** - no NgModules
- **Use signals over observables** where possible: `signal()`, `computed()`, `effect()`
- **Dependency injection**: Use `inject()` function, not constructor injection
- **Imports**: Import `HlmButtonImports`, `HlmInputImports` (arrays) for Spartan components

Example:
```typescript
export class MyComponent {
  readonly authService = inject(AuthService);
  readonly isLoading = signal(false);
  readonly userData = computed(() => this.authService.user());
}
```

### 2. Spartan UI Component System
UI components live in `libs/ui/` and are imported via path aliases defined in `tsconfig.json`:
```typescript
import { HlmButtonDirective } from '@spartan-ng/helm/button';
import { HlmInputDirective } from '@spartan-ng/helm/input';
```

**Key components**: button, input, card, dialog, alert, table, badge, select, date-picker, sheet, checkbox, switch

### 3. Time Registration Workflow
Registration follows a strict **4-step sequence**:
1. **ENTRADA** (Clock in)
2. **SAIDA_ALMOCO** (Lunch break start)
3. **RETORNO_ALMOCO** (Lunch break end)
4. **SAIDA** (Clock out)

This is enforced in `registro-ponto.component.ts` with validation preventing out-of-order registrations. Configuration allows skipping lunch (2-step: ENTRADA → SAIDA).

### 4. Backend API Design
- **Base URL**: `http://localhost:3000/api` (configured in `environment.ts`)
- **Groups**: `/api/auth`, `/api/configuracoes`, `/api/registros-ponto`, `/api/periodos`, `/api/users`
- **Authentication**: PIN-based (4-digit) or face recognition (simulated)
- **Validation**: Uses Elysia's `t.Object()` schema validation

### 5. Database Models (Prisma)
Key entities:
- **User**: Stores employee data, PIN, admin flag, `cargaHorariaDiaria`, `salarioMensal`
- **RegistroPonto**: Individual clock entries with `tipoHorario`, `horario`, `fotoUrl`, `localizacao`
- **PeriodoFechamento**: Monthly closing periods with calculated hours/overtime

**Enums**: `TipoHorario`, `TipoRegistro`, `StatusRegistro`, `StatusFechamento`

### 6. Configuration System
Labor settings stored in-memory (server-side) via `config-helper.ts`:
- Overtime percentages (50%, 100%)
- Night shift calculation (22:00-05:00)
- DSR (weekly rest) calculation
- Location-based validation (GPS radius)

Frontend mirrors config in `configuracoes.service.ts` with signals.

## Development Workflows

### Running the App
```bash
bun run dev                # Concurrent: Angular dev server + Bun backend
bun run start              # Frontend only (port 4200)
bun run server:dev         # Backend only with hot reload (port 3000)
```

### Database Management
```bash
bun run prisma:migrate     # Create migration after schema.prisma changes
bun run prisma:generate    # Regenerate Prisma client
bun run prisma:studio      # Visual DB browser
bun run prisma:seed        # Populate with sample data
```

### Production Setup
```bash
bun run init:production    # Clears DB, creates admin user, saves credentials to credentials-admin.json
```
**CRITICAL**: Delete `credentials-admin.json` after noting credentials!

### Testing
```bash
bun run test               # Karma + Jasmine unit tests
```

## Key Files Reference

### Frontend Entry Points
- `src/app/app.routes.ts` - Route definitions with guards (`authGuard`, `adminGuard`)
- `src/app/app.config.ts` - Angular providers (router, HttpClient)
- `src/app/core/services/` - All business logic services

### Backend Entry Points
- `server/index.ts` - All API endpoints (762 lines - use grep to find specific routes)
- `server/lib/config-helper.ts` - Labor law calculation functions
- `server/lib/prisma.ts` - Prisma client singleton

### Configuration
- `angular.json` - Angular CLI config
- `components.json` - Spartan UI path configuration
- `prisma/schema.prisma` - Database schema (always run migrations after changes)

## Common Tasks

### Adding a New UI Component
1. Check if it exists in `libs/ui/` first
2. If not, use `@spartan-ng/cli` to generate: `npx @spartan-ng/cli add [component-name]`
3. Import from `@spartan-ng/helm/[component-name]`

### Adding an API Endpoint
1. Add route in `server/index.ts` using Elysia's `.group()` pattern
2. Define validation schema with `t.Object()`
3. Use `prisma` client for DB operations
4. Frontend: Add method in corresponding service (e.g., `registro-ponto.service.ts`)

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `bun run prisma:migrate` with descriptive name
3. Update TypeScript interfaces in `src/app/core/models/`
4. Regenerate client if needed: `bun run prisma:generate`

### Adding Guards/Route Protection
- Auth check: Use `authGuard` (checks if user logged in)
- Admin check: Use `adminGuard` (checks `user.isAdmin`)
- Public routes: Use `noAuthGuard` (redirects authenticated users)

## Conventions

### TypeScript
- **Strict mode enabled** - all strict compiler options are on
- **No implicit any** - always type function parameters
- **Prefer interfaces** over types for object shapes
- **Readonly fields** where applicable (especially signals)

### Naming
- Services: `*.service.ts` (suffix required)
- Components: `*.component.ts` (suffix required)
- Models: `*.model.ts` (plain interfaces, enums)
- Guards: `*.guard.ts` (functional guards, not class-based)

### File Organization
- Feature-based folders (not by type)
- Barrel exports (`index.ts`) for services only
- Keep components co-located with their templates (inline templates for UI)

### Git Workflow
- Branch: `master` (main development)
- Deploy docs: See `README.Docker.md` and `README.Coolify.md` for Docker/Coolify deployment

## Environment Variables
Backend requires `DATABASE_URL` in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/meu_ponto?schema=public"
```

## Known Issues / Edge Cases
- **Time validation**: Clock-in times must be chronological within a day
- **Timezone**: All dates use `America/Sao_Paulo` timezone
- **Photo storage**: Currently stores base64 in DB (consider file storage for production)
- **Config persistence**: Labor configs are in-memory (use Redis or DB for multi-instance deployments)

## Testing the App
1. Run `bun run init:production` to create admin user
2. Login with generated PIN at `/login`
3. Access admin panel at `/admin` (requires `isAdmin: true`)
4. Register time at `/registro-ponto` (follows 4-step workflow)
5. View monthly closings at `/fechamento-ponto`

---

**For questions about labor law calculations**, see `server/lib/config-helper.ts` - includes functions for overtime, night shift, DSR, and delay penalties.
