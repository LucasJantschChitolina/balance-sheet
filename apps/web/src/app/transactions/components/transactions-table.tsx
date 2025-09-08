"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@balancete/backend/convex/_generated/api";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { TransactionForm } from "./transaction-form";
import { toast } from "sonner";
import type { DataModel } from "@balancete/backend/convex/_generated/dataModel";

type Transaction = DataModel["transactions"]["document"] & {
	entries: (DataModel["transactionEntries"]["document"] & {
		account?: DataModel["accounts"]["document"];
	})[];
};

interface TransactionsTableProps {
	transactions: Transaction[];
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
	const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
	const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

	const deleteTransaction = useMutation(api.transactions.deleteTransaction);

	// Fetch accounts for display
	const allAccounts = useQuery(api.accounts.getAllAccounts) || [];

	// Create a map of account ID to account for quick lookup
	const accountsMap = new Map(allAccounts.map(account => [account._id, account]));

	// Add account data to transaction entries
	const transactionsWithAccountData = transactions.map(transaction => ({
		...transaction,
		entries: transaction.entries.map(entry => ({
			...entry,
			account: accountsMap.get(entry.accountId),
		})),
	}));

	const handleDelete = async () => {
		if (!deletingTransaction) return;

		try {
			await deleteTransaction({ id: deletingTransaction._id });
			toast.success("Lançamento excluído com sucesso");
			setDeletingTransaction(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Falha ao excluir lançamento");
		}
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(amount);
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString('pt-BR');
	};

	return (
		<>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Data</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead>Referência</TableHead>
							<TableHead>Valor</TableHead>
							<TableHead>Linhas</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-[70px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{transactionsWithAccountData.length === 0 ? (
							<TableRow>
								<TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
									Nenhum lançamento encontrado. Crie o primeiro lançamento para começar.
								</TableCell>
							</TableRow>
						) : (
							transactionsWithAccountData.map((transaction) => (
								<TableRow key={transaction._id}>
									<TableCell className="font-medium">
										{formatDate(transaction.date)}
									</TableCell>
									<TableCell className="max-w-xs truncate">
										{transaction.description || "-"}
									</TableCell>
									<TableCell className="font-mono text-sm">
										{transaction.reference || "-"}
									</TableCell>
									<TableCell className="font-medium">
										{formatCurrency(transaction.totalAmount)}
									</TableCell>
									<TableCell>
										<div className="text-sm">
											{transaction.entries.length} linha{transaction.entries.length !== 1 ? 's' : ''}
										</div>
									</TableCell>
									<TableCell>
										<Badge variant={transaction.isBalanced ? "default" : "destructive"}>
											{transaction.isBalanced ? "Balanceado" : "Desbalanceado"}
										</Badge>
									</TableCell>
									<TableCell>
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" className="size-8 p-0">
													<MoreHorizontal className="size-4" />
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
													<Edit className="mr-2 size-4" />
													Editar
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => setDeletingTransaction(transaction)}
													className="text-red-600 focus:text-red-600"
												>
													<Trash2 className="mr-2 size-4" />
													Excluir
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Edit Transaction Dialog */}
			{editingTransaction && (
				<TransactionForm
					open={!!editingTransaction}
					onOpenChange={(open) => !open && setEditingTransaction(null)}
					mode="edit"
					transaction={editingTransaction}
				/>
			)}

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir Lançamento</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza de que deseja excluir este lançamento? Esta ação não pode ser desfeita.
							O lançamento será removido permanentemente do sistema.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancelar</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
							Excluir
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
