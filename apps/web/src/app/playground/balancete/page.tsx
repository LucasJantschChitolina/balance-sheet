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

interface AccountBalance {
  account: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  accountType: string;
}

interface BalanceteData {
  period: string;
  entries: AccountingEntry[];
}

export default function BalancetePage() {
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [totalDebits, setTotalDebits] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    const data = accountingEntries as BalanceteData;
    const balances = calculateAccountBalances(data.entries);
    setAccountBalances(balances);
    
    const totals = calculateTotals(balances);
    setTotalDebits(totals.totalDebits);
    setTotalCredits(totals.totalCredits);
  }, []);

  const calculateAccountBalances = (entries: AccountingEntry[]): AccountBalance[] => {
    const accountMap = new Map<string, { debits: number; credits: number }>();

    entries.forEach(entry => {
      entry.debits.forEach(debit => {
        const current = accountMap.get(debit.account) || { debits: 0, credits: 0 };
        current.debits += debit.amount;
        accountMap.set(debit.account, current);
      });

      entry.credits.forEach(credit => {
        const current = accountMap.get(credit.account) || { debits: 0, credits: 0 };
        current.credits += credit.amount;
        accountMap.set(credit.account, current);
      });
    });

    return Array.from(accountMap.entries()).map(([account, totals]) => ({
      account,
      debitTotal: totals.debits,
      creditTotal: totals.credits,
      balance: totals.debits - totals.credits,
      accountType: getAccountType(account)
    })).sort((a, b) => {
      const typeOrder = ['Ativos', 'Passivos', 'Patrimônio Líquido', 'Receitas', 'Despesas'];
      const aIndex = typeOrder.indexOf(a.accountType);
      const bIndex = typeOrder.indexOf(b.accountType);
      return aIndex - bIndex;
    });
  };

  const getAccountType = (account: string): string => {
    const accountLower = account.toLowerCase();
    
    if (accountLower.includes('caixa') || accountLower.includes('clientes') || 
        accountLower.includes('estoques') || accountLower.includes('depreciação')) {
      return 'Ativos';
    }
    if (accountLower.includes('fornecedores') || accountLower.includes('salários a pagar') || 
        accountLower.includes('inss a recolher') || accountLower.includes('provisão') || 
        accountLower.includes('fgts a recolher') || accountLower.includes('icms a recolher') || 
        accountLower.includes('pis a recolher') || accountLower.includes('cofins a recolher')) {
      return 'Passivos';
    }
    if (accountLower.includes('receita')) {
      return 'Receitas';
    }
    if (accountLower.includes('despesa')) {
      return 'Despesas';
    }
    return 'Outros';
  };

  const calculateTotals = (balances: AccountBalance[]) => {
    const totalDebits = balances.reduce((sum, balance) => sum + balance.debitTotal, 0);
    const totalCredits = balances.reduce((sum, balance) => sum + balance.creditTotal, 0);
    return { totalDebits, totalCredits };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const groupedBalances = accountBalances.reduce((groups, balance) => {
    if (!groups[balance.accountType]) {
      groups[balance.accountType] = [];
    }
    groups[balance.accountType].push(balance);
    return groups;
  }, {} as Record<string, AccountBalance[]>);

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Totais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-sm">Total de Débitos</p>
              <p className="font-bold text-2xl text-red-600">{formatCurrency(totalDebits)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total de Créditos</p>
              <p className="font-bold text-2xl text-green-600">{formatCurrency(totalCredits)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Diferença</p>
              <p className={`font-bold text-2xl ${totalDebits === totalCredits ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalDebits - totalCredits)}
              </p>
            </div>
          </div>
          {totalDebits === totalCredits && (
            <div className="mt-4 text-center">
              <p className="font-medium text-green-600 text-sm">✓ Balancete equilibrado corretamente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.entries(groupedBalances).map(([accountType, balances]) => (
        <Card key={accountType}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {accountType}
              <Badge variant="secondary">{balances.length} contas</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balances.map((balance) => (
                  <TableRow key={balance.account}>
                    <TableCell className="font-medium">{balance.account}</TableCell>
                    <TableCell className="text-right">
                      {balance.debitTotal > 0 ? formatCurrency(balance.debitTotal) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {balance.creditTotal > 0 ? formatCurrency(balance.creditTotal) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${
                      balance.balance > 0 ? 'text-red-600' : 
                      balance.balance < 0 ? 'text-green-600' : 'text-muted-foreground'
                    }`}>
                      {balance.balance !== 0 ? formatCurrency(Math.abs(balance.balance)) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
