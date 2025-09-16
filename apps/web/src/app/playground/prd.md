# Balance Sheet Application - Product Requirements Document

## Overview

A web-based balance sheet application built with Next.js and Convex for generating financial reports from accounting entries data.

## Core Requirements

### 1. Balancete Report

**Purpose**: Generate a trial balance showing all account balances from accounting entries.

**Key Features**:

- Calculate account balances from debit/credit entries
- Group accounts by type (Assets, Liabilities, Equity, Revenue, Expenses)
- Display debit and credit totals
- Show net balance for each account
- Export to PDF/Excel

### 2. Relatório das Despesas de Folha de Pagamento

**Purpose**: Generate payroll expense report showing all salary-related costs.

**Key Features**:

- Filter entries containing salary-related accounts (marked with "R")
- Group by employee (João, Maria)
- Show gross salary, deductions (INSS), and net amounts
- Calculate total payroll expenses
- Include provisions (13th salary, vacation, FGTS)

### 3. Relatório de Impostos Apurados

**Purpose**: Generate tax report showing all tax-related transactions.

**Key Features**:

- Filter entries containing tax accounts (ICMS, PIS, COFINS)
- Show tax amounts collected on sales
- Group by tax type
- Calculate total taxes due
- Display payment status (to be collected vs collected)

## Technical Implementation

- Parse accounting entries from JSON data
- Calculate running balances for each account
- Filter and aggregate data by report type
- Generate formatted reports with tables and totals
- Export functionality for each report type
