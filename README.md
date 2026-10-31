# Brightloop Subscription Management

A unified platform for managing subscription-based businesses, built as part of a hackathon challenge.

## 📌 Overview

Brightloop Subscription Management aims to simplify the complete subscription lifecycle for Brightloop Software, from product and plan creation to recurring billing, invoice management, payment tracking, and revenue reporting.

The platform is designed to replace manual processes with a centralized system that helps administrators, internal staff, and customers manage subscriptions efficiently.

## 🎯 Objectives

- Centralize product, plan, and subscription management.
- Automate recurring invoice generation and billing workflows.
- Simplify payment tracking and outstanding invoice management.
- Support configurable taxes, discounts, and product variants.
- Provide role-based access for administrators, staff, and customers.
- Offer a dashboard for monitoring subscriptions, payments, and revenue.
- Maintain reliable performance as the number of subscriptions grows.

## ✨ Planned Features

- **User Authentication:** Secure registration, login, and password reset.
- **Role-Based Access Control:** Separate permissions for administrators, internal staff, and customers.
- **Product & Plan Management:** Create products, configure variants, and define billing frequencies.
- **Subscription Management:** Create quotations, confirm subscriptions, manage renewals, and handle subscription status changes.
- **Recurring Billing:** Generate invoices automatically from subscriptions when billing is due.
- **Invoice Management:** Create, confirm, send, cancel, and track invoices.
- **Tax & Discount Management:** Apply configurable tax rules and discount policies.
- **Payment Tracking:** Record payments and identify outstanding or overdue invoices.
- **Customer Portal:** Allow customers to view and manage their subscriptions and invoices.
- **Revenue Dashboard:** Display subscription statistics, payment summaries, revenue, and overdue invoices.

## 🛠️ Technology Stack

The technology stack will be finalized during development.

- **Frontend:** To be decided
- **Backend:** To be decided
- **Database:** To be decided
- **Authentication:** To be decided
- **Deployment:** To be decided

## 📂 Project Structure

The repository structure will be updated as development progresses.

```text
Brightloop-Subscription-Management/
├── README.md
└── .gitignore
```

## 🌿 Git Branching Strategy

To maintain a clean and stable codebase, this project follows a branch-based development workflow.

### Branches

- **`main`:** The stable branch containing approved and integrated code. Direct pushes to this branch are not allowed.
- **`dev`:** The shared development branch where team members integrate their completed features and bug fixes.

### Contribution Rules

1. **Do not push directly to `main`.** All development work must go through the development workflow.
2. **Push changes to `dev`.** Team members should integrate their work into the shared development branch.
3. **Test before pushing.** Ensure your changes work correctly and do not introduce avoidable errors.
4. **Use meaningful commit messages.** Clearly describe the changes made in each commit.
5. **Keep your branch updated.** Pull the latest changes from `dev` before starting or integrating new work.
6. **Coordinate with the team.** Avoid overwriting or conflicting with other team members' changes.
7. **Promote stable code to `main` through a Pull Request.** Changes should be reviewed and approved before being merged into `main`.

### Recommended Workflow

For individual features, team members can create their own feature branches from `dev`, push their changes to those branches, and open a Pull Request targeting `dev`.

```text
main
  │
  └── dev
       ├── feature/authentication
       ├── feature/subscription-management
       ├── feature/invoice-management
       └── feature/revenue-dashboard
```

Once the changes are tested and integrated into `dev`, the team can create a Pull Request from `dev` to `main` when the code is ready for a stable release.

### Basic