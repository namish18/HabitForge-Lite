# Contributing to HabitForge Lite
Thank you for your interest in contributing to HabitForge Lite! We welcome contributions of all kinds, including bug fixes, features, documentation improvements, and testing.

## Getting Started
### 1. Fork the Repository

Fork the repository to your GitHub account and clone it locally.

```bash
git clone https://github.com/<your-username>/HabitForge-Lite.git
cd HabitForge-Lite
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```
Update the values with your own configuration.

### 4. Run the Application

```bash
npm run dev
```
The application will be available at:

```text
http://localhost:3000
```
---

## Branch Naming Convention
Please create a separate branch for your changes.

Examples:

```text
feat/add-registration
fix/login-validation
docs/update-readme
refactor/storage-module
```

---
## Commit Message Guidelines

Use clear and descriptive commit messages.

Examples:

```text
feat: add registration page

fix: resolve JWT session validation issue

docs: add contributing guide
```
---

## Working on Issues

* Check existing open issues.
* Comment to express your interest.
* Wait for assignment if maintainers prefer assigning issues.
* Discuss implementation details before making major architectural changes.

---

## Pull Request Workflow

Before opening a pull request:

* Ensure the project builds successfully.
* Test your changes locally.
* Keep pull requests focused on a single issue.
* Reference the related issue in the PR description.

Example:

```text
Fixes #13
```

---

## Testing

Before submitting:

```bash
npm run lint
npm run build
```

Verify that the application behaves as expected.

---

## Code Style

* Follow the existing project structure.
* Use meaningful variable and function names.
* Remove unused imports and dead code.
* Maintain consistent formatting.

---

## Need Help?

If you have questions, feel free to open a discussion or ask within the relevant issue thread.

Thank you for contributing to HabitForge Lite!
