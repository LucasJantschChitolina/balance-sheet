"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import accountingEntries from "../accounting-entries.json";

interface AccountEntry {
  account: string;
  amount: number;
  isReportingAccount: boolean;
}

interface AccountingEntry {
  id: number;
  description: string;
  date: string;
  debits: AccountEntry[];
  credits: AccountEntry[];
}

interface PayrollExpense {
  employee: string;
  grossSalary: number;
  inssDeduction: number;
  netSalary: number;
  fgts: number;
  thirteenthSalary: number;
  vacation: number;
  totalCost: number;
}

interface PayrollData {
  period: string;
  entries: AccountingEntry[];
}

export default function FolhaPagamentoPage() {
  const [payrollExpenses, setPayrollExpenses] = useState<PayrollExpense[]>([]);
  const [totalPayrollCost, setTotalPayrollCost] = useState(0);
  const [totalProvisions, setTotalProvisions] = useState(0);

  useEffect(() => {
    const data = accountingEntries as PayrollData;
    const expenses = calculatePayrollExpenses(data.entries);
    setPayrollExpenses(expenses);
    
    const totals = calculateTotals(expenses);
    setTotalPayrollCost(totals.totalPayrollCost);
    setTotalProvisions(totals.totalProvisions);
  }, []);

  const calculatePayrollExpenses = (entries: AccountingEntry[]): PayrollExpense[] => {
    const employeeMap = new Map<string, PayrollExpense>();

    // Initialize employees
    employeeMap.set("João", {
      employee: "João",
      grossSalary: 0,
      inssDeduction: 0,
      netSalary: 0,
      fgts: 0,
      thirteenthSalary: 0,
      vacation: 0,
      totalCost: 0
    });

    employeeMap.set("Maria", {
      employee: "Maria",
      grossSalary: 0,
      inssDeduction: 0,
      netSalary: 0,
      fgts: 0,
      thirteenthSalary: 0,
      vacation: 0,
      totalCost: 0
    });

    entries.forEach(entry => {
      // Process salary expenses (marked with R)
      entry.debits.forEach(debit => {
        if (debit.isReportingAccount && debit.account.includes("Salário")) {
          const employeeName = debit.account.includes("João") ? "João" : "Maria";
          const employee = employeeMap.get(employeeName);
          if (employee) {
            employee.grossSalary += debit.amount;
          }
        }
      });

      // Process INSS deductions
      entry.credits.forEach(credit => {
        if (credit.account.includes("INSS a Recolher")) {
          const employee = employeeMap.get("João");
          if (employee && entry.description.includes("João")) {
            employee.inssDeduction += credit.amount;
          }
          const employeeMaria = employeeMap.get("Maria");
          if (employeeMaria && entry.description.includes("Maria")) {
            employeeMaria.inssDeduction += credit.amount;
          }
        }
      });
    });

    // Process provisions
    entries.forEach(entry => {
      if (entry.description.includes("Provisão de Décimo Terceiro")) {
        const provision = entry.debits.find(d => d.isReportingAccount);
        if (provision) {
          // Distribute 13th salary provision between employees (proportional to salary)
          const joao = employeeMap.get("João");
          const maria = employeeMap.get("Maria");
          if (joao && maria) {
            const totalSalary = joao.grossSalary + maria.grossSalary;
            if (totalSalary > 0) {
              joao.thirteenthSalary = (provision.amount * joao.grossSalary) / totalSalary;
              maria.thirteenthSalary = (provision.amount * maria.grossSalary) / totalSalary;
            }
          }
        }
      }

      if (entry.description.includes("Provisão de Férias")) {
        const provision = entry.debits.find(d => d.isReportingAccount);
        if (provision) {
          // Distribute vacation provision between employees (proportional to salary)
          const joao = employeeMap.get("João");
          const maria = employeeMap.get("Maria");
          if (joao && maria) {
            const totalSalary = joao.grossSalary + maria.grossSalary;
            if (totalSalary > 0) {
              joao.vacation = (provision.amount * joao.grossSalary) / totalSalary;
              maria.vacation = (provision.amount * maria.grossSalary) / totalSalary;
            }
          }
        }
      }

      if (entry.description.includes("FGTS sobre Folha")) {
        const fgts = entry.debits.find(d => d.isReportingAccount);
        if (fgts) {
          // Distribute FGTS between employees (proportional to salary)
          const joao = employeeMap.get("João");
          const maria = employeeMap.get("Maria");
          if (joao && maria) {
            const totalSalary = joao.grossSalary + maria.grossSalary;
            if (totalSalary > 0) {
              joao.fgts = (fgts.amount * joao.grossSalary) / totalSalary;
              maria.fgts = (fgts.amount * maria.grossSalary) / totalSalary;
            }
          }
        }
      }
    });

    // Calculate net salary and total cost for each employee
    Array.from(employeeMap.values()).forEach(employee => {
      employee.netSalary = employee.grossSalary - employee.inssDeduction;
      employee.totalCost = employee.grossSalary + employee.fgts + employee.thirteenthSalary + employee.vacation;
    });

    return Array.from(employeeMap.values()).filter(emp => emp.grossSalary > 0);
  };

  const calculateTotals = (expenses: PayrollExpense[]) => {
    const totalPayrollCost = expenses.reduce((sum, expense) => sum + expense.totalCost, 0);
    const totalProvisions = expenses.reduce((sum, expense) => 
      sum + expense.fgts + expense.thirteenthSalary + expense.vacation, 0);
    return { totalPayrollCost, totalProvisions };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-sm">Custo Total da Folha</p>
              <p className="font-bold text-2xl text-blue-600">{formatCurrency(totalPayrollCost)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total de Provisões</p>
              <p className="font-bold text-2xl text-orange-600">{formatCurrency(totalProvisions)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Detalhamento por Funcionário
            <Badge variant="secondary">{payrollExpenses.length} funcionários</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-right">Salário Bruto</TableHead>
                <TableHead className="text-right">INSS</TableHead>
                <TableHead className="text-right">Salário Líquido</TableHead>
                <TableHead className="text-right">FGTS</TableHead>
                <TableHead className="text-right">13º Salário</TableHead>
                <TableHead className="text-right">Férias</TableHead>
                <TableHead className="text-right">Custo Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollExpenses.map((expense) => (
                <TableRow key={expense.employee}>
                  <TableCell className="font-medium">{expense.employee}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(expense.grossSalary)}
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    -{formatCurrency(expense.inssDeduction)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(expense.netSalary)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(expense.fgts)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(expense.thirteenthSalary)}
                  </TableCell>
                  <TableCell className="text-right text-orange-600">
                    {formatCurrency(expense.vacation)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-blue-600">
                    {formatCurrency(expense.totalCost)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Custos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Salários Brutos:</span>
              <span className="font-medium">
                {formatCurrency(payrollExpenses.reduce((sum, e) => sum + e.grossSalary, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Encargos Sociais (FGTS):</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(payrollExpenses.reduce((sum, e) => sum + e.fgts, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Provisão 13º Salário:</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(payrollExpenses.reduce((sum, e) => sum + e.thirteenthSalary, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Provisão Férias:</span>
              <span className="font-medium text-orange-600">
                {formatCurrency(payrollExpenses.reduce((sum, e) => sum + e.vacation, 0))}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">Custo Total da Folha:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(totalPayrollCost)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
