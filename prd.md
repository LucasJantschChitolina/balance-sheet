# Balance Sheet Application - Product Requirements Document

## Overview

A web-based balance sheet application built with Next.js and Convex for managing financial accounts and transactions with double-entry bookkeeping compliance.

## Core Requirements

### 1. Account Management

**Purpose**: Provide a structured way to organize and categorize financial accounts according to accounting principles.

**Key Features**:

- Support for three main account types: Assets, Liabilities, and Equity
- Hierarchical account structure (main accounts with sub-accounts)
- Account naming and numbering conventions
- Account activation/deactivation
- Search and filtering capabilities
- Table view of accounts

**User Stories**:

- As a user, I want to create asset accounts for cash, inventory, and fixed assets
- As a user, I want to organize liability accounts for loans and payables
- As a user, I want to track equity accounts for retained earnings and capital

### 2. Transaction Recording

**Purpose**: Enable accurate recording of financial transactions with proper debit/credit mechanics.

**Key Features**:

- Transaction date, description, and reference number
- Multi-line transaction support (multiple account entries per transaction)
- Debit/credit amount entry with automatic balancing
- Transaction categories and tags
- Transaction editing and deletion
- Transaction search and filtering by date, amount, or account

**User Stories**:

- As a user, I want to record a cash sale with debit to cash and credit to revenue
- As a user, I want to enter monthly loan payments with debit to loan principal and interest expense
- As a user, I want to track inventory purchases with debit to inventory and credit to accounts payable

### 3. Balance Calculations & Reports

**Purpose**: Provide real-time financial position visibility through automated calculations and reporting.

**Key Features**:

- Automatic account balance calculations based on transaction history
- Real-time balance sheet generation (Assets = Liabilities + Equity)
- Period-end balance reports
- Account balance history and trends
- Export capabilities for external reporting

**User Stories**:

- As a user, I want to see my current asset, liability, and equity balances
- As a user, I want to generate balance sheets for specific dates
- As a user, I want to track how account balances change over time

### 4. Transaction Validation

**Purpose**: Ensure data integrity and compliance with accounting principles.

**Key Features**:

- Debit/credit balance validation (must equal for each transaction)
- Account type validation (prevent invalid debit/credit combinations)
- Transaction completeness checks
- Error messaging for validation failures
- Audit trail for all transaction changes

**User Stories**:

- As a user, I want to be prevented from saving unbalanced transactions
- As a user, I want clear error messages when transactions are invalid
- As a user, I want assurance that all transactions follow accounting rules

## Technical Considerations

- Built with Next.js for frontend, Convex for backend
- TailwindCSS for styling
- Shadcn/ui for components
- Lucide for icons
- Radix UI for primitives
- TypeScript for type safety
- Responsive design for desktop and mobile use
- Real-time data synchronization
- Secure data storage with proper access controls
- Zod for validation of backend and frontend
- React Hook Form for form handling
