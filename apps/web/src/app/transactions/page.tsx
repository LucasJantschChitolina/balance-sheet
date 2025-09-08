"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TransactionsTable } from "./components/transactions-table";
import { TransactionForm } from "./components/transaction-form";
import { api } from "@balancete/backend/convex/_generated/api";

export default function TransactionsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedType, setSelectedType] = useState<"all" | "debit" | "credit">("all");
	const [showCreateForm, setShowCreateForm] = useState(false);

	// Fetch transactions data
	const transactionsWithEntries = useQuery(api.transactions.getTransactionsWithEntries) || [];

	// Filter transactions based on search
	const filteredTransactions = transactionsWithEntries.filter((transaction) => {
		const matchesSearch =
			transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
			transaction.entries.some(entry =>
				entry.description?.toLowerCase().includes(searchTerm.toLowerCase())
			);

		if (selectedType === "all") return matchesSearch;

		const hasType = transaction.entries.some(entry => entry.type === selectedType);
		return matchesSearch && hasType;
	});

	const transactionStats = {
		total: transactionsWithEntries.length,
		totalAmount: transactionsWithEntries.reduce((sum, t) => sum + t.totalAmount, 0),
		thisMonth: transactionsWithEntries.filter(t => {
			const transactionDate = new Date(t.date);
			const now = new Date();
			return transactionDate.getMonth() === now.getMonth() &&
						 transactionDate.getFullYear() === now.getFullYear();
		}).length,
	};

	return (
		<div>
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Lançamentos Contábeis</h1>
					<p className="text-muted-foreground">
						Registre e gerencie todas as transações financeiras da empresa
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Novo Lançamento
				</Button>
			</div>

			{/* Statistics Cards */}
			<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total de Lançamentos
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{transactionStats.total}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Lançamentos Este Mês
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">
							{transactionStats.thisMonth}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Valor Total</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							R$ {transactionStats.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mb-6 flex flex-col gap-4 sm:flex-row">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
					<Input
						placeholder="Pesquisar lançamentos por descrição ou referência..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Tabs
					value={selectedType}
					onValueChange={(value) => setSelectedType(value as "all" | "debit" | "credit")}
				>
					<TabsList>
						<TabsTrigger value="all">Todos</TabsTrigger>
						<TabsTrigger value="debit">Débitos</TabsTrigger>
						<TabsTrigger value="credit">Créditos</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{/* Transactions Table */}
			<Card>
				<CardHeader>
					<CardTitle>Lançamentos Contábeis</CardTitle>
					<CardDescription>
						Mostrando {filteredTransactions.length} de {transactionsWithEntries.length} lançamentos
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TransactionsTable transactions={filteredTransactions} />
				</CardContent>
			</Card>

			{/* Create Transaction Dialog */}
			<TransactionForm
				open={showCreateForm}
				onOpenChange={setShowCreateForm}
				mode="create"
			/>
		</div>
	);
}
