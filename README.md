# HabitForge Lite

HabitForge Lite is a professional productivity application designed to manage personal workflows. The system is built on Next.js and utilizes GitHub repository architecture to store application state and user records without relying on traditional databases.

## Key Capabilities

* Cloud Database Integration
  HabitForge Lite implements GitHub as a cloud database. All personal data is saved in structured files inside a private repository. This structure removes the necessity of external hosting services for databases and ensures complete ownership of your data.

* Categories
  Users can group their activities into broad categories. Each category supports customizable color coding and icon designations for clear visual separation.

* Subcategories
  Every main category supports further organization through subcategories. This hierarchical structure enables precise grouping of tasks under specific parent domains.

* Tasks
  The task engine supports complete creation, retrieval, updates, and deletion. Tasks include parameters for priority levels, estimated durations, and text searching.

* Timers
  An integrated focus timer tracks session durations. Users can initiate countdown sessions and save completed intervals directly to their history.

* Analytics
  A data visualization suite displays weekly progress and activity density. Users can view category distributions and daily completion performance.

## Contribution Guidelines

We welcome contributions from the open source community. Please follow these steps to contribute to this project:

1. Fork the repository to your own account.
2. Select any active issue or propose enhancements.
3. Commit your changes and submit a pull request for review.

## Deployment and Setup

You can deploy your own instance of HabitForge Lite by following these four steps.

### Step 1: Fork the Repository

Begin by forking this repository to your personal GitHub account. This creates a copy of the codebase that you can deploy and modify.

### Step 2: Configure the GitHub API Token

You must generate an access token so the application can communicate with GitHub.
1. Navigate to Developer Settings on GitHub and create a personal access token using the classic option.
2. Ensure you select the repository scope for this token.
3. Configure the token expiration settings. If you choose a custom date instead of the never expire option, you must regenerate and update this token after the specified duration.

### Step 3: Initialize the Database Repository

Create another private GitHub repository, which will act as the database. This repository serves as the cloud database where the application writes categories, subcategories, tasks, and historical session logs.

### Step 4: Deploy and Configure Environment Variables

Connect your Vercel account with GitHub and deploy the frontend. Go to the environment variables section in Vercel. You can check the `.env.local.example` file and copy the variable names from it. Put your own password, API token, GitHub owner identity, and database repository name:

* GITHUB_TOKEN
  The personal access token generated in the second step.

* GITHUB_OWNER
  Your GitHub username or organization identifier.

* GITHUB_REPO
  The name of the private repository created to store database files.

* APP_PASSWORD
  A custom password of your choice to restrict access to the application dashboard.

* JWT_SECRET
  A secure key used for signing session tokens.
