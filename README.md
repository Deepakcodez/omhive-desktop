# Omhive Desktop 🐝

An elegant desktop activity tracker and window inspector built using **Electron**, **React**, **TypeScript**, and **Tailwind CSS**. It monitors active system applications, tracks idle periods, facilitates user attendance controls (Login, Break, Resume, Logout), and provides beautiful local visual analytics.

---

## Table of Contents

1. [Key Features](#key-features)
2. [Technical Stack](#technical-stack)
3. [Architecture Overview](#architecture-overview)
4. [Folder Structure](#folder-structure)
5. [IPC API Reference](#ipc-api-reference)
6. [Local Config & Tuning](#local-config--tuning)
7. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Development](#development)
   - [Building & Packaging](#building--packaging)
8. [Recommended Development Settings](#recommended-development-settings)

---

## Key Features

- 🖥️ **Active Window Tracking**: Automatically inspects and captures the active application name (`software`) and active window title every **2 seconds** using `get-windows`.
- 💤 **Smart Idle Detection**: Monitors system-wide idle state via Electron’s native `powerMonitor`. Suspends active tracking and logs idle duration once the user remains inactive for **60 seconds** (customizable).
- 💾 **Local Cache Resiliency**: Caches tracking sessions locally in a lightweight JSON store (`electron-store`) every **3 seconds** to prevent data loss in case of system shutdowns or networking hiccups.
- 🔄 **Automatic Cloud Syncing**: Synchronizes cached activities to the cloud in batches every **10 seconds** or upon application termination.
- ⏱️ **Attendance Controls**: Built-in punches for Login, Break / Resume, and Logout, syncing directly with the workspace API.
- 📊 **Rich Analytics Dashboard**: Includes a complete visualization portal utilizing `recharts`:
  - **Active Ratios**: Real-time percentage display of active time vs. idle periods.
  - **App Distribution**: Interactive pie charts breaking down exact time spent per application.
  - **Hourly Timelines**: Stacked bar charts depicting active work categorizations vs. idle blocks.
  - **Chronological Logs**: Fully searchable log tables mapping exactly when transitions occurred.

---

## Technical Stack

- **Framework**: [Electron](https://www.electronjs.org/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [electron-vite](https://electron-vite.org/) (High-performance Vite compiler orchestrator)
- **Router**: [TanStack React Router](https://tanstack.com/router/latest) (Type-safe file-based router)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Charts**: [Recharts](https://recharts.org/) (D3-backed React charting primitives)
- **Storage**: [electron-store](https://github.com/sindresorhus/electron-store) (Persisted key-value settings store)
- **Window Detection**: [get-windows](https://github.com/sindresorhus/get-windows) (Active window inspector)

---

## Architecture Overview

Omhive Desktop follows the standard Electron multi-process architectural pattern:

```mermaid
graph TD
    subgraph Main Process (NodeJS Runtime)
        A[main/index.ts] --> B[PowerMonitor]
        A --> C[Window Tracker / get-windows]
        A --> D[electron-store / local cache]
        A --> E[IPC Handlers]
    end
    subgraph Preload Script (Secure Bridge)
        E <--> F[contextBridge / window.api]
    end
    subgraph Renderer Process (Chromium browser)
        F <--> G[React Application / Routes]
        G --> H[TanStack Router]
        G --> I[Recharts Dashboard]
    end
    A -- REST API --> J[Backend API Server]
```

1. **Main Process**: Resolves the OS host and user details, sets up polling loops, coordinates the native system power monitor, manages local caches on disk, and interacts with remote servers.
2. **Preload Script**: Sits between the Main and Renderer processes. Exposes limited, secure IPC handles through `contextBridge` to protect application sandboxing.
3. **Renderer Process**: Bootstraps the UI, handles routing, listens for IPC streams to update live metrics, and renders visuals.

---

## Folder Structure

Below is an overview of the repository structure:

```
omhive-desktop/
├── .vscode/                 # VS Code configuration (settings, debugger launch configurations, extension tips)
├── build/                   # Platform-specific packaging resources (app icons, macOS plists)
├── resources/               # Static system tray/tray icons
├── src/
│   ├── main/                # Main Process backend (Node.js environment)
│   │   ├── constants/       # App-wide constants (polling intervals, endpoints)
│   │   ├── ipc/             # Inter-process communication (IPC) handler scripts
│   │   │   ├── alert.ts     # Triggers native dialog system alerts
│   │   │   ├── user.ts      # Exposes user authentication status, break, and logout API integrations
│   │   │   └── activity.tsx # Activity IPC registration (Reserved for future handlers)
│   │   ├── types/           # Core TypeScript types (TSession, UserInfoType, AppState)
│   │   ├── utils/           # Utility helpers (networking, server synchronization)
│   │   └── index.ts         # Main Entrypoint: Orchestrates window lifecycle, polling, and local cache
│   ├── preload/             # Secure context bridge script
│   │   ├── index.d.ts       # Global window.api TypeScript interfaces
│   │   └── index.ts         # Exposes API functions into window.api
│   └── renderer/            # Renderer Process frontend (React & Tailwind CSS)
│       ├── index.html       # Single Page Application HTML root template
│       └── src/             # React application source code
│           ├── assets/      # Stylesheets, SVG vectors, theme resources
│           ├── components/  # Reusable React components (e.g., Versions display)
│           ├── hooks/       # Custom React hooks (e.g. useActivity for real-time IPC streams)
│           ├── routes/      # File-based TanStack Router components
│           │   ├── admin/   # Dashboard containing charts, logs, and activity stats
│           │   ├── __root.tsx# Root layout holding toaster popups and development tools
│           │   └── index.tsx# Punch Card interface (Login, Break/Resume, Logout)
│           ├── env.d.ts     # Global Vite environment variables typing
│           ├── main.css     # Tailwinds baseline CSS import stylesheet
│           ├── main.tsx     # React frontend entrypoint
│           └── routeTree.gen.ts # Automatically generated routes catalog
├── electron-builder.yml     # Desktop packaging profile configuration
├── electron.vite.config.ts  # Combined configuration profile for Electron and Vite
├── package.json             # Manifest scripts, target dependency versions, package metadata
├── tsconfig.json            # Base TypeScript configuration
├── tsconfig.node.json       # main and preload TypeScript definitions
└── tsconfig.web.json        # renderer web UI TypeScript definitions
```

---

## IPC API Reference

The React UI (`renderer`) interacts with Electron via `window.api`. The following methods are exposed:

### Methods

| Name                 | Type   | Payload / Parameters                                                    | Returns                                                          | Description                                                             |
| -------------------- | ------ | ----------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `loginUser`          | Invoke | `{ username: string }`                                                  | `Promise<{ success: boolean, data: UserInfo, message: string }>` | Authenticades client, saves metadata, and enables background tracking.  |
| `breakUser`          | Invoke | `{ attendanceId: string }`                                              | `Promise<ApiResponse>`                                           | Places user on a break; disables tracking updates temporarily.          |
| `resumeUser`         | Invoke | `{ attendanceId: string }`                                              | `Promise<ApiResponse>`                                           | Resumes user from a break; enables tracking updates.                    |
| `logoutUser`         | Invoke | `{ attendanceId: string }`                                              | `Promise<ApiResponse>`                                           | Terminate session, pushes final logs, and stops active tracker.         |
| `getPendingSessions` | Invoke | `None`                                                                  | `Promise<TSession[]>`                                            | Retrieves sessions buffered in memory but not yet saved to local store. |
| `getAllSession`      | Invoke | `None`                                                                  | `Promise<{ sessions: TSession[] }>`                              | Returns all sessions persisted inside local cache database.             |
| `alert`              | Invoke | `{ title: string, message: string, type?: 'info'\|'warning'\|'error' }` | `Promise<MessageBoxReturnValue>`                                 | Opens a native operating system message alert box.                      |

### Event Listeners

| Event Name         | Callback Parameter            | Description                                                                  |
| ------------------ | ----------------------------- | ---------------------------------------------------------------------------- |
| `onIdleTime`       | `(idleTime: number) => void`  | Listens to a continuous stream of system idle seconds.                       |
| `onActivityUpdate` | `(session: TSession) => void` | Fires whenever a new completed session block is closed and pushed to the UI. |

---

## Local Config & Tuning

Global settings are stored inside [src/main/constants/index.ts](file:///d:/code/projects/major/omhive-desktop/src/main/constants/index.ts). Adjust these parameters as necessary for your environment:

- `POLL_INTERVAL_MS` (Default: `2000`): Frequency at which the active window scanner queries the OS.
- `IDLE_THRESHOLD_SEC` (Default: `60`): Seconds of zero user input before declaring an idle state.
- `MIN_SESSION_DURATION_SEC` (Default: `10`): Minimum seconds a window must remain in focus to be logged.
- `SYNC_LOCAL_INTERVAL_MS` (Default: `3000`): Frequency at which active sessions are dumped to the `electron-store` on disk.
- `SYNC_REMOTE_INTERVAL_MS` (Default: `10000`): Frequency at which cached database records are batched and uploaded to the server.
- `API_ENDPOINT` (Default: `http://localhost:5001/api`): The host URL of the remote backend API server.

---

## Getting Started

### Prerequisites

Make sure you have Node.js and **pnpm** installed on your developer machine.

### Installation

Install workspace dependencies:

```bash
pnpm install
```

### Development

Run the compiler watch service and launch Electron in developer mode:

```bash
pnpm dev
```

### Building & Packaging

To compile project code and bundle production-ready desktop executables, run the appropriate target commands:

```bash
# General full production build
pnpm build

# Pack and output as raw directory (for quick testing)
pnpm build:unpack

# Build installer for Windows
pnpm build:win

# Build installer for macOS
pnpm build:mac

# Build installer for Linux
pnpm build:linux
```

_Note: Platform targets are output to the `/dist` directory._

---

## Recommended Development Settings

To ensure format and validation consistency across commits:

- **VSCode Extensions**:
  - `dbaeumer.vscode-eslint` (ESLint linter verification)
  - `esbenp.prettier-vscode` (Prettier code formatter)
- **Formatting Rule Reference**:
  - Prettier is configured under `.prettierrc.yaml` (80 characters width print margin, single quotes, and 2-space indentation). Format check is run automatically on build.
