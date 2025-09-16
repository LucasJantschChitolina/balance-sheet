"use client";

import { useEffect, useState  } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
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

interface TaxData {
  taxType: string;
  taxName: string;
  amountCollected: number;
  amountToPay: number;
  description: string;
}

interface TaxReportData {
  period: string;
  entries: AccountingEntry[];
}

export default function ImpostosApuradosPage() {
  const [taxData, setTaxData] = useState<TaxData[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [totalToPay, setTotalToPay] = useState(0);

  useEffect(() => {
    const data = accountingEntries as TaxReportData;
    const taxes = calculateTaxData(data.entries);
    setTaxData(taxes);
    
    const totals = calculateTotals(taxes);
    setTotalCollected(totals.totalCollected);
    setTotalToPay(totals.totalToPay);
  }, []);

  const calculateTaxData = (entries: AccountingEntry[]): TaxData[] => {
    const taxMap = new Map<string, TaxData>();

    entries.forEach(entry => {
      // Process ICMS
      if (entry.description.includes("ICMS sobre Vendas")) {
        const icmsDebit = entry.debits.find(d => d.account.includes("ICMS sobre Vendas"));
        const icmsCredit = entry.credits.find(c => c.account.includes("ICMS a Recolher"));
        
        if (icmsDebit && icmsCredit) {
          taxMap.set("ICMS", {
            taxType: "ICMS",
            taxName: "ICMS - Imposto sobre Circulação de Mercadorias e Serviços",
            amountCollected: icmsDebit.amount,
            amountToPay: icmsCredit.amount,
            description: "ICMS sobre vendas de mercadorias"
          });
        }
      }

      // Process PIS
      if (entry.description.includes("PIS sobre Vendas")) {
        const pisDebit = entry.debits.find(d => d.account.includes("PIS sobre Vendas"));
        const pisCredit = entry.credits.find(c => c.account.includes("PIS a Recolher"));
        
        if (pisDebit && pisCredit) {
          taxMap.set("PIS", {
            taxType: "PIS",
            taxName: "PIS - Programa de Integração Social",
            amountCollected: pisDebit.amount,
            amountToPay: pisCredit.amount,
            description: "PIS sobre vendas de mercadorias"
          });
        }
      }

      // Process COFINS
      if (entry.description.includes("COFINS sobre Vendas")) {
        const cofinsDebit = entry.debits.find(d => d.account.includes("COFINS sobre Vendas"));
        const cofinsCredit = entry.credits.find(c => c.account.includes("COFINS a Recolher"));
        
        if (cofinsDebit && cofinsCredit) {
          taxMap.set("COFINS", {
            taxType: "COFINS",
            taxName: "COFINS - Contribuição para o Financiamento da Seguridade Social",
            amountCollected: cofinsDebit.amount,
            amountToPay: cofinsCredit.amount,
            description: "COFINS sobre vendas de mercadorias"
          });
        }
      }
    });

    return Array.from(taxMap.values());
  };

  const calculateTotals = (taxes: TaxData[]) => {
    const totalCollected = taxes.reduce((sum, tax) => sum + tax.amountCollected, 0);
    const totalToPay = taxes.reduce((sum, tax) => sum + tax.amountToPay, 0);
    return { totalCollected, totalToPay };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getTaxColor = (taxType: string) => {
    switch (taxType) {
      case 'ICMS': return 'text-blue-600';
      case 'PIS': return 'text-green-600';
      case 'COFINS': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getTaxBadgeVariant = (taxType: string) => {
    switch (taxType) {
      case 'ICMS': return 'default';
      case 'PIS': return 'secondary';
      case 'COFINS': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Resumo dos Impostos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-sm">Total Arrecadado</p>
              <p className="font-bold text-2xl text-green-600">{formatCurrency(totalCollected)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total a Recolher</p>
              <p className="font-bold text-2xl text-red-600">{formatCurrency(totalToPay)}</p>
            </div>
          </div>
          {totalCollected === totalToPay && (
            <div className="mt-4 text-center">
              <p className="flex items-center justify-center gap-2 font-medium text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                Impostos apurados corretamente
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Detalhamento por Imposto
            <Badge variant="secondary">{taxData.length} impostos</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imposto</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor Arrecadado</TableHead>
                <TableHead className="text-right">Valor a Recolher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxData.map((tax) => (
                <TableRow key={tax.taxType}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant={getTaxBadgeVariant(tax.taxType)}>
                        {tax.taxType}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div>
                      <p className="font-medium">{tax.taxName}</p>
                      <p className="text-muted-foreground text-sm">{tax.description}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-medium ${getTaxColor(tax.taxType)}`}>
                      {formatCurrency(tax.amountCollected)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-red-600">
                      {formatCurrency(tax.amountToPay)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Impostos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {taxData.map((tax) => (
              <div key={tax.taxType} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Badge variant={getTaxBadgeVariant(tax.taxType)}>
                    {tax.taxType}
                  </Badge>
                  <div>
                    <p className="font-medium">{tax.taxName}</p>
                    <p className="text-muted-foreground text-sm">{tax.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {formatCurrency(tax.amountToPay)}
                  </p>
                </div>
              </div>
            ))}
            
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="font-bold">Total a Recolher:</span>
                <span className="font-bold text-lg text-red-600">
                  {formatCurrency(totalToPay)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
