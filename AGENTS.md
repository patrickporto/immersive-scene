<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# AGENTS.md

## Navigation Index

- [Architecture Overview](#architecture-overview)
- [Feature-Based Folder Structure](#feature-based-folder-structure)
- [State Management - Zustand](#state-management---zustand)
- [Styling with Tailwind CSS](#styling-with-tailwind-css)
- [Animations with Motion](#animations-with-motion)
- [Design System](#design-system)
- [Code Quality & Linting](#code-quality--linting)
- [React Components Rules](#react-components-rules)
- [Hooks Rules](#hooks-rules)
- [Testing with Vitest](#testing-with-vitest)
- [TSDoc Documentation](#tsdoc-documentation)
- [Import Rules](#import-rules)
- [Technologies](#technologies)

---

## Architecture Overview

This project follows a modular **Feature-Based Architecture**, where each application functionality is organized into independent and self-contained features. Each feature contains all necessary resources (components, hooks, stores, tests) to work in isolation.

### Core Principles

1. **Separation of Concerns**: Each file has a clear, single responsibility
2. **Cohesion**: Related resources are kept close to each other
3. **Reusability**: Shared components and hooks are in `shared/`
4. **Testability**: All components and hooks must be testable
5. **Living Documentation**: Tests serve as documentation of expected behavior

---

## Feature-Based Folder Structure

### Complete Structure

```
src/
├── app/                          # Global application configurations
│   ├── providers/                # Global providers (React Query, Theme, etc)
│   ├── router/                   # Route configuration
│   ├── store/                    # Global store (Zustand) - when needed
│   └── styles/                   # Global styles
├── features/                     # Application features
│   └── {feature-name}/           # Feature name in kebab-case
│       ├── components/           # Feature-specific components
│       │   ├── ComponentName.tsx
│       │   ├── ComponentName.test.tsx
│       │   └── ComponentName.css
│       ├── hooks/                # Feature custom hooks
│       │   ├── useHookName.ts
│       │   └── useHookName.test.ts
│       ├── stores/               # Feature Zustand stores
│       │   └── featureStore.ts
│       ├── types/                # Feature-specific TypeScript types
│       │   └── feature.types.ts
│       ├── utils/                # Feature-specific utilities
│       │   └── featureUtils.ts
│       └── index.ts              # Public feature export
├── shared/                       # Resources shared between features
│   ├── components/               # Reusable components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.css
│   │   └── index.ts
│   ├── hooks/                    # Global reusable hooks
│   ├── lib/                      # External libraries and configurations
│   ├── types/                    # Global types
│   ├── utils/                    # Global utility functions
│   └── constants/                # Global constants
└── main.tsx                      # Application entry point
```

### Naming Conventions

#### Folders

- **Features**: `kebab-case` (e.g., `user-profile`, `shopping-cart`)
- **Components**: `PascalCase` (e.g., `Button`, `UserCard`)
- **Hooks**: `camelCase` prefixed with `use` (e.g., `useAuth`, `useLocalStorage`)
- **Stores**: `camelCase` (e.g., `userStore.ts`, `cartStore.ts`)
- **Utilities**: `camelCase` (e.g., `formatDate.ts`, `validateEmail.ts`)

#### Files

- **React Components**: `ComponentName.tsx`
- **Tests**: `ComponentName.test.tsx` or `hookName.test.ts`
- **Styles**: `ComponentName.css` (same name as component)
- **Types**: `feature.types.ts` or `ComponentName.types.ts`

---

## State Management - Zustand

This project uses **Zustand** as the main state management library. All stores must follow the patterns below:

### Store Structure

1. **Feature Stores**: Each feature must have its own store located at `src/features/{feature-name}/stores/`
2. **Global Store (if needed)**: For states shared between multiple features, use `src/app/store/`

### Naming Conventions

- Store name: `use{Feature}Store` (e.g., `useGreetStore`, `useAuthStore`)
- File: `{feature}Store.ts` (e.g., `greetStore.ts`, `authStore.ts`)
- State interface: `{Feature}State` (e.g., `GreetState`, `AuthState`)

### Implementation Pattern

```typescript
import { create } from 'zustand';

interface FeatureState {
  // State
  data: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  setData: (data: string) => void;
  fetchData: () => Promise<void>;
  reset: () => void;
}

export const useFeatureStore = create<FeatureState>((set, get) => ({
  // Initial state
  data: '',
  isLoading: false,
  error: null,

  // Actions
  setData: (data: string) => set({ data }),
  fetchData: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch logic
      const result = await api.fetch();
      set({ data: result });
    } catch (error) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
  reset: () => set({ data: '', isLoading: false, error: null }),
}));
```

### Best Practices

1. **Never use React useState for global state** - Always prefer Zustand
2. **Keep stores small and focused** - One store per feature/responsibility
3. **Use selectors for optimization** - Avoid unnecessary re-renders
4. **Persistence**: Use `zustand/middleware` to persist state when needed
5. **Async actions**: Always manage loading and error states

### Custom Hooks

Prefer creating custom hooks that encapsulate the store:

```typescript
export function useFeature() {
  const { data, isLoading, error, setData, fetchData, reset } = useFeatureStore();

  return {
    data,
    isLoading,
    error,
    setData,
    fetchData,
    reset,
  };
}
```

### Export

Always export the store and hook through the feature's `index.ts` file:

```typescript
// src/features/feature/index.ts
export { useFeatureStore } from './stores/featureStore';
export { useFeature } from './hooks/useFeature';
export { ComponentName } from './components/ComponentName';
export type { FeatureType } from './types/feature.types';
```

---

## Styling with Tailwind CSS

**MANDATORY RULE**: **Tailwind CSS is the ONLY way to create and use styles** in this project. Plain CSS files are NOT allowed.

### Why Tailwind CSS?

- **Utility-first**: Rapid development with pre-defined utility classes
- **Consistent**: Standardized design tokens across the application
- **Maintainable**: No CSS file management or naming conflicts
- **Performance**: Only used styles are included in the final bundle
- **Responsive**: Built-in responsive design utilities

### Installation & Configuration

Tailwind CSS v4 is already installed. Configuration is handled via CSS:

```css
/* src/app/styles/globals.css */
@import 'tailwindcss';

@theme {
  /* Custom theme variables */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  /* ... */
}
```

### Usage Patterns

#### Basic Component

```typescript
// ✅ Correct: Using Tailwind classes
export function Button({ children }: ButtonProps) {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
      {children}
    </button>
  );
}

// ❌ Wrong: Using CSS files
// Button.css - NOT ALLOWED
```

#### Conditional Classes

```typescript
import { clsx } from 'clsx';

export function Button({ variant, disabled }: ButtonProps) {
  return (
    <button
      className={clsx(
        'px-4 py-2 rounded-lg transition-colors',
        {
          'bg-blue-500 text-white hover:bg-blue-600': variant === 'primary',
          'bg-gray-500 text-white hover:bg-gray-600': variant === 'secondary',
          'opacity-50 cursor-not-allowed': disabled,
        }
      )}
    >
      Click me
    </button>
  );
}
```

#### Responsive Design

```typescript
export function Card() {
  return (
    <div className="w-full md:w-1/2 lg:w-1/3 p-4">
      {/* Responsive: full width on mobile, half on tablet, third on desktop */}
    </div>
  );
}
```

### Prohibited

- ❌ CSS files (`.css`)
- ❌ CSS-in-JS libraries (styled-components, emotion)
- ❌ Inline styles (`style={{ ... }}`)
- ❌ CSS Modules (`.module.css`)

### Allowed Utilities

- ✅ Tailwind utility classes
- ✅ `clsx` or `class-variance-authority` for conditional classes
- ✅ Tailwind `@apply` in global CSS (rarely needed)

---

## Animations with Motion

**MANDATORY RULE**: **All new components must be animated using Motion (Framer Motion)**. Animations enhance user experience and provide visual feedback.

### Why Motion?

- **Declarative**: Easy-to-use React API for animations
- **Performant**: Hardware-accelerated animations
- **Flexible**: From simple transitions to complex gestures
- **Accessible**: Respects reduced motion preferences

### Installation

Motion is already installed: `npm install framer-motion`

### Basic Usage Patterns

#### Fade In Component

```typescript
import { motion } from 'framer-motion';

export function FadeIn({ children }: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
```

#### Hover Animation

```typescript
import { motion } from 'framer-motion';

export function HoverCard({ children }: HoverCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="p-6 bg-white rounded-lg shadow-lg cursor-pointer"
    >
      {children}
    </motion.div>
  );
}
```

#### Staggered List

```typescript
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

export function AnimatedList({ items }: AnimatedListProps) {
  return (
    <motion.ul
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {items.map((item) => (
        <motion.li key={item.id} variants={itemVariants}>
          {item.name}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

#### Page Transitions

```typescript
import { motion, AnimatePresence } from 'framer-motion';

export function PageTransition({ children, isVisible }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="page"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Animation Guidelines

1. **Purposeful**: Every animation should serve a purpose (feedback, guidance, delight)
2. **Subtle**: Animations should not distract from content
3. **Consistent**: Use consistent timing and easing across the app
4. **Accessible**: Respect `prefers-reduced-motion` media query
5. **Performant**: Use `transform` and `opacity` for smooth 60fps animations

### Recommended Animation Values

```typescript
// Standard durations
const durations = {
  fast: 0.15, // Micro-interactions
  normal: 0.3, // Standard transitions
  slow: 0.5, // Emphasis animations
};

// Standard easings
const easings = {
  default: [0.4, 0, 0.2, 1], // ease-in-out
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: { type: 'spring', stiffness: 300, damping: 30 },
};
```

### Testing Animated Components

When testing components with Motion:

```typescript
// Mock framer-motion for tests
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    // ... other elements
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));
```

---

## Design System

**MANDATORY RULE**: **All new components must use the Design System**. The Design System ensures consistency, accessibility, and maintainability across the application.

### Core Principles

1. **Consistency**: Use existing components and patterns
2. **Reusability**: Build upon shared components
3. **Accessibility**: All components must be accessible
4. **Documentation**: Changes must be documented

### Using the Design System

#### Available Components

All design system components are in `src/shared/components/`:

```typescript
// ✅ Correct: Using design system components
import { Button, Card, Input, Modal } from '@/shared/components';

export function UserProfile() {
  return (
    <Card>
      <Input label="Name" />
      <Button variant="primary">Save</Button>
    </Card>
  );
}

// ❌ Wrong: Creating custom components when design system has them
export function CustomButton() { ... }  // Use Button from design system instead
```

#### Design Tokens

Use Tailwind's theme configuration for consistent values:

```typescript
// Colors
className = 'text-primary bg-secondary';

// Spacing
className = 'p-4 m-2 gap-4';

// Typography
className = 'text-lg font-semibold';

// Shadows
className = 'shadow-md shadow-lg';

// Border radius
className = 'rounded-lg rounded-full';
```

### Evolving the Design System

#### When to Add New Elements

New design system elements should be added when:

- The need is validated across multiple features
- Existing components cannot fulfill the requirement
- The pattern improves consistency or accessibility

#### Planning Process

Before adding a new element to the design system:

1. **Analyze**: Is this pattern needed in multiple places?
2. **Design**: How does it fit with existing components?
3. **Document**: Update AGENTS.md with the new component
4. **Implement**: Create in `src/shared/components/`
5. **Test**: Ensure it works across different contexts
6. **Review**: Get approval from the team

#### Implementation Checklist

When adding a new design system component:

- [ ] Component follows the 300-line limit
- [ ] Component has comprehensive tests
- [ ] Component is fully documented with TSDoc
- [ ] Component includes Motion animations
- [ ] Component uses only Tailwind CSS
- [ ] Component is accessible (ARIA labels, keyboard navigation)
- [ ] Component supports all necessary variants
- [ ] Component is exported from `src/shared/components/index.ts`
- [ ] **AGENTS.md is updated** with the new component documentation

### Documenting Design System Changes

**MANDATORY**: All changes to the Design System must be documented in AGENTS.md.

Add new sections under "Design System" as needed:

```markdown
### New Component: ComponentName

**Added**: 2024-01-15
**Purpose**: Brief description of what this component does
**Usage**: Code example
**Props**: List of props with descriptions
**Variants**: Available variants and when to use them
```

### Current Design System Components

#### Button

**Purpose**: Primary action trigger
**Usage**:

```typescript
<Button variant="primary" onClick={handleClick}>
  Click me
</Button>
```

**Variants**: `primary`, `secondary`, `danger`, `ghost`
**Animations**: Scale on hover, press feedback

#### Card

**Purpose**: Content container with elevation
**Usage**:

```typescript
<Card elevation="medium" padding="large">
  Content here
</Card>
```

**Props**: `elevation`, `padding`, `borderRadius`
**Animations**: Subtle lift on hover

#### Input

**Purpose**: Text input field
**Usage**:

```typescript
<Input
  label="Email"
  type="email"
  error={errors.email}
  {...register('email')}
/>
```

**Props**: `label`, `error`, `type`, `placeholder`
**Animations**: Focus state transition

---

## Code Quality & Linting

This project uses **ESLint**, **Prettier**, and **Husky** to maintain code quality and consistency. All code must pass linting and formatting checks before being committed.

### Available Scripts

```bash
# Linting
npm run lint          # Check for linting errors
npm run lint:fix      # Fix linting errors automatically

# Formatting
npm run format        # Format all files with Prettier
npm run format:check  # Check if files are formatted correctly

# Type checking
npm run typecheck     # Check TypeScript types without emitting
```

### MANDATORY: Run Lint Fix Before Delivery

**CRITICAL RULE**: Before delivering any task involving code changes, you **MUST** run:

```bash
npm run lint:fix
```

This ensures:

- All code follows the project's style guidelines
- Import statements are properly sorted
- Common errors are automatically fixed
- Code is properly formatted

### ESLint Configuration

The project uses ESLint v9 with the new flat config format (`eslint.config.js`). Key features:

- **TypeScript ESLint**: Full TypeScript support
- **React Hooks**: Rules for proper hook usage
- **React Refresh**: Ensures components can be hot-reloaded
- **Import Sorting**: Automatic import organization with `import/order`
- **Prettier Integration**: Code formatting as ESLint rules

#### Import Order Rules

Imports are automatically sorted in this order:

1. Built-in modules (e.g., `react`, `node:*`)
2. External dependencies
3. Internal aliases (`@/*`)
4. Parent/sibling imports
5. Index imports
6. Type imports

```typescript
// ✅ Correct: Imports are automatically sorted
import React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';

import { Button } from '@/shared/components';
import { useAuth } from '@/features/auth';

import { helper } from '../utils';
import { config } from './config';

import type { User } from './types';
```

### Prettier Configuration

Prettier is configured with the following settings:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Git Hooks (Husky + lint-staged)

Git hooks are configured to automatically run linting and formatting on commit:

- **Pre-commit hook**: Runs `lint-staged` before each commit
- **lint-staged**: Only runs on staged files
  - TypeScript/React files: ESLint fix + Prettier
  - CSS/JSON/MD files: Prettier only

This ensures that committed code is always properly formatted and linted.

### VS Code Integration

For the best development experience, configure VS Code to:

1. **Install Extensions**:
   - ESLint
   - Prettier - Code: formatter
   - Tailwind CSS IntelliSense

2. **Enable Format on Save** (`.vscode/settings.json`):
   ```json
   {
     "editor.formatOnSave": true,
     "editor.defaultFormatter": "esbenp.prettier-vscode",
     "editor.codeActionsOnSave": {
       "source.fixAll.eslint": "explicit"
     }
   }
   ```

### Common Linting Issues

#### Import Order

If imports are not in the correct order, run:

```bash
npm run lint:fix
```

#### Unused Variables

Prefix unused variables with `_`:

```typescript
// ✅ Correct
function handleClick(_event: MouseEvent) { ... }

// ❌ Wrong - will cause lint error
function handleClick(event: MouseEvent) { ... }  // event is unused
```

#### Missing Dependencies in Hooks

Always include all dependencies in `useEffect`, `useCallback`, `useMemo`:

```typescript
// ✅ Correct
useEffect(() => {
  fetchData(userId);
}, [userId, fetchData]);

// ❌ Wrong - missing dependencies
useEffect(() => {
  fetchData(userId);
}, []);
```

### Troubleshooting

#### ESLint not working in VS Code

1. Restart VS Code
2. Check that ESLint extension is installed
3. Run `npm run lint` to verify CLI works

#### Prettier not formatting on save

1. Check `.vscode/settings.json` configuration
2. Ensure Prettier extension is installed
3. Set Prettier as default formatter

#### Husky hooks not running

1. Run `npm run prepare` to reinstall hooks
2. Check that `.husky/pre-commit` exists
3. Verify file permissions

---

## React Components Rules

### 1. One Component Per File

**MANDATORY RULE**: Each file must contain **only one React component**.

```typescript
// ✅ Correct: Only one component per file
// src/features/user/components/UserCard.tsx
export function UserCard({ user }: UserCardProps) {
  return <div>{user.name}</div>;
}

// ❌ Wrong: Multiple components in the same file
export function UserCard() { ... }
export function UserAvatar() { ... }  // Should be in UserAvatar.tsx
```

### 2. Line Limit

**RULE**: Components must not exceed **300 lines**.

If a component exceeds 300 lines, it must be refactored:

- Extract sub-components into separate files
- Move logic to custom hooks
- Split responsibilities

```typescript
// ❌ Wrong: Component too large (>300 lines)
export function UserDashboard() {
  // 400+ lines of code...
}

// ✅ Correct: Component split into sub-components
// UserDashboard.tsx (100 lines)
export function UserDashboard() {
  return (
    <div>
      <UserHeader />
      <UserStats />
      <UserActivity />
    </div>
  );
}

// UserHeader.tsx (80 lines)
// UserStats.tsx (90 lines)
// UserActivity.tsx (85 lines)
```

### 3. Separation of Concerns

Each component must have a clear, single responsibility:

- **UI Components**: Visual presentation
- **Container Components**: Business logic and state
- **Page Components**: Component composition

### 4. Props and Typing

Always define interfaces for props:

```typescript
interface ButtonProps {
  /** Text displayed on the button */
  label: string;
  /** Function called when button is clicked */
  onClick: () => void;
  /** Visual variant of the button */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Disabled state */
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled }: ButtonProps) {
  // ...
}
```

---

## Hooks Rules

### 1. Line Limit

**RULE**: Hooks must not exceed **100 lines**.

If a hook exceeds 100 lines, it must be split into smaller hooks.

### 2. Single Responsibility

**RULE**: Each hook must have **only one responsibility**.

```typescript
// ✅ Correct: Hook with single responsibility
// useLocalStorage.ts - Only manages localStorage
export function useLocalStorage<T>(key: string, initialValue: T) {
  // ...
}

// ❌ Wrong: Hook with multiple responsibilities
export function useUserData() {
  // Fetches user data
  // Manages localStorage
  // Formats data
  // Validates form
  // ... many responsibilities
}

// ✅ Correct: Split into smaller hooks
export function useUser() {
  /* fetches data */
}
export function useUserStorage() {
  /* manages storage */
}
export function useUserFormatter() {
  /* formats data */
}
```

### 3. All Hooks Must Have Tests

**MANDATORY RULE**: Every custom hook must have a test file.

```
src/features/auth/hooks/
├── useAuth.ts
└── useAuth.test.ts  ← Mandatory tests
```

### 4. Hook Conventions

- Name: `use{Functionality}` (e.g., `useAuth`, `useForm`)
- Always return a named object to facilitate destructuring
- Document parameters and return with TSDoc

```typescript
/**
 * Hook to manage user authentication
 * @param options - Configuration options
 * @returns Object with authentication state and actions
 */
export function useAuth(options?: AuthOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: Credentials) => {
    // ...
  }, []);

  const logout = useCallback(() => {
    // ...
  }, []);

  return {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
```

---

## Testing with Vitest

### 1. Test File for Each Component

**MANDATORY RULE**: Every React component must have a test file in the **same folder**.

```
src/features/user/components/
├── UserCard.tsx
└── UserCard.test.tsx  ← Test in the same folder
```

### 2. Test File Naming

- Components: `{ComponentName}.test.tsx`
- Hooks: `{hookName}.test.ts`
- Utilities: `{utilName}.test.ts`

### 3. Tests as Living Documentation

Tests must document **all expected behaviors** of the component:

```typescript
// UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserCard } from './UserCard';

/**
 * @description Tests for the UserCard component
 * @requirements
 * - Should display the user's name
 * - Should display the user's email
 * - Should display avatar when available
 * - Should show placeholder when no avatar
 * - Should apply highlight class for premium users
 * - Should call onClick when clicked
 * - Should be disabled when disabled=true
 */
describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://example.com/avatar.jpg',
    isPremium: true,
  };

  it('should render the user name', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should render the user email', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });

  it('should display avatar when available', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByAltText("John Doe's Avatar")).toHaveAttribute(
      'src',
      'https://example.com/avatar.jpg'
    );
  });

  it('should show placeholder when no avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined };
    render(<UserCard user={userWithoutAvatar} />);
    expect(screen.getByTestId('avatar-placeholder')).toBeInTheDocument();
  });

  it('should apply highlight class for premium users', () => {
    render(<UserCard user={mockUser} />);
    expect(screen.getByTestId('user-card')).toHaveClass('premium');
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<UserCard user={mockUser} onClick={handleClick} />);
    screen.getByTestId('user-card').click();
    expect(handleClick).toHaveBeenCalledWith(mockUser);
  });

  it('should be disabled when disabled=true', () => {
    render(<UserCard user={mockUser} disabled />);
    expect(screen.getByTestId('user-card')).toBeDisabled();
  });
});
```

### 4. Test Coverage

Each test must cover:

- **Initial rendering**: Component renders correctly
- **Props**: All props are applied correctly
- **States**: Loading, error, empty, etc states
- **Events**: onClick, onChange, onSubmit, etc
- **Edge cases**: Empty data, null, undefined
- **Accessibility**: Roles, labels, aria attributes

### 5. Test Structure

```typescript
describe('ComponentName', () => {
  // Setup and mocks
  beforeEach(() => {
    // ...
  });

  describe('rendering', () => {
    it('should render correctly', () => {});
    it('should render with default props', () => {});
  });

  describe('behavior', () => {
    it('should respond to events', () => {});
    it('should update state', () => {});
  });

  describe('edge cases', () => {
    it('should handle empty data', () => {});
    it('should handle errors', () => {});
  });
});
```

---

## TSDoc Documentation

### 1. Mandatory Comments

Every file must have TSDoc comments for:

- **Functions**: Description, parameters, return
- **Classes**: Class description
- **Methods**: Description, parameters, return
- **Interfaces/Types**: Description and each property
- **React Components**: Description and props

### 2. Comment Pattern

````typescript
/**
 * @description Clear description of what the function/component does
 * @param name - Parameter description
 * @param age - Parameter description
 * @returns Description of the returned value
 * @example
 * ```typescript
 * const result = myFunction('John', 25);
 * console.log(result); // 'John is 25 years old'
 * ```
 */
function myFunction(name: string, age: number): string {
  return `${name} is ${age} years old`;
}
````

### 3. Examples by Type

#### React Component

````typescript
/**
 * @description Card component to display user information
 * @param props - Component properties
 * @param props.user - User data to be displayed
 * @param props.onClick - Callback called when card is clicked
 * @param props.disabled - Whether the card is disabled
 * @example
 * ```tsx
 * <UserCard
 *   user={{ name: 'John', email: 'john@email.com' }}
 *   onClick={(user) => console.log(user)}
 * />
 * ```
 */
interface UserCardProps {
  /** User data */
  user: User;
  /** Callback when card is clicked */
  onClick?: (user: User) => void;
  /** Disabled state */
  disabled?: boolean;
}

export function UserCard({ user, onClick, disabled }: UserCardProps) {
  // ...
}
````

#### Hook

````typescript
/**
 * @description Hook to manage form state with validation
 * @param initialValues - Initial form values
 * @param validationSchema - Validation schema (Zod/Yup)
 * @returns Object with form state and manipulation functions
 * @example
 * ```typescript
 * const { values, errors, handleChange, handleSubmit } = useForm({
 *   initialValues: { email: '', password: '' },
 *   validationSchema: loginSchema
 * });
 * ```
 */
export function useForm<T extends Record<string, unknown>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  // ...
}
````

#### Utility Function

````typescript
/**
 * @description Formats a number as Brazilian currency (BRL)
 * @param value - Numeric value to be formatted
 * @param options - Additional formatting options
 * @returns Formatted string (e.g., 'R$ 1.234,56')
 * @example
 * ```typescript
 * formatCurrency(1234.56); // 'R$ 1.234,56'
 * formatCurrency(1234.56, { prefix: '' }); // '1.234,56'
 * ```
 */
export function formatCurrency(value: number, options?: FormatCurrencyOptions): string {
  // ...
}
````

#### Interface/Type

```typescript
/**
 * @description Represents a user in the system
 * @property id - Unique user identifier
 * @property name - User's full name
 * @property email - User's email (must be unique)
 * @property createdAt - Account creation date
 * @property isActive - Whether the account is active
 */
interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  isActive: boolean;
}
```

---

## Import Rules

### Import Hierarchy

```
shared/     ← Cannot import from features/ or app/
  ↓
features/   ← Can import from shared/ and other features via index.ts
  ↓
app/        ← Can import from anywhere
```

### Detailed Rules

- **Features** can import from `shared/` and from other features only via `index.ts`
- **Shared** cannot import from `features/` or `app/`
- **App** can import from anywhere

### Examples

```typescript
// ✅ Correct: Importing from shared/
import { Button } from '@/shared/components';

// ✅ Correct: Importing from another feature via index.ts
import { useAuth } from '@/features/auth';

// ❌ Wrong: Importing directly from another feature
import { useAuth } from '@/features/auth/hooks/useAuth';

// ❌ Wrong: Shared importing from feature
// In src/shared/components/Button.tsx:
import { useAuth } from '@/features/auth'; // NOT ALLOWED
```

---

## Technologies

- **React 19** with TypeScript
- **Vite** for build
- **Tauri** for desktop application
- **Zustand** for state management
- **Tailwind CSS** for styling (MANDATORY - no plain CSS)
- **Motion (Framer Motion)** for animations (MANDATORY for all components)
- **Vitest** for unit testing
- **React Testing Library** for component testing
- **ESLint** for code linting
- **Prettier** for code formatting
- **Husky** for git hooks

---

## Development Checklist

Before finalizing a feature, check:

- [ ] Components follow the 300-line limit
- [ ] Hooks follow the 100-line limit
- [ ] All components have a test file
- [ ] All hooks have a test file
- [ ] All files have TSDoc comments
- [ ] Tests cover all expected behaviors
- [ ] **Components use Tailwind CSS exclusively** (no CSS files)
- [ ] **Components include Motion animations**
- [ ] **Components use the Design System**
- [ ] Imports follow hierarchy rules
- [ ] Naming follows conventions
- [ ] Zustand store follows the defined pattern
- [ ] Exports are in the feature's index.ts

---

## Navigation for LLMs

To find specific information in this document:

- **Folder structure**: Look for "Feature-Based Folder Structure"
- **Zustand**: Look for "State Management - Zustand"
- **Tailwind CSS**: Look for "Styling with Tailwind CSS"
- **Motion/Animations**: Look for "Animations with Motion"
- **Design System**: Look for "Design System"
- **Linting**: Look for "Code Quality & Linting"
- **Components**: Look for "React Components Rules"
- **Hooks**: Look for "Hooks Rules"
- **Tests**: Look for "Testing with Vitest"
- **TSDoc**: Look for "TSDoc Documentation"
- **Imports**: Look for "Import Rules"
- **Checklist**: Look for "Development Checklist"

To navigate the project:

1. Features are in `src/features/{feature-name}/`
2. Shared components in `src/shared/components/`
3. Shared hooks in `src/shared/hooks/`
4. Stores in `src/features/{feature}/stores/`
5. Tests always in the same folder as the tested file
