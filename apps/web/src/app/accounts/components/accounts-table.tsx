"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
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
import { MoreHorizontal, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { AccountForm } from "./account-form";
import { toast } from "sonner";
import type { DataModel } from "@balancete/backend/convex/_generated/dataModel";
import { getAccountTypeLabel, getStatusColor, getStatusLabel, getAccountTypeColor } from "@/lib/utils";

type Account = DataModel["accounts"]['document'];

interface AccountsTableProps {
	accounts: Account[];
}

export function AccountsTable({ accounts }: AccountsTableProps) {
	const [editingAccount, setEditingAccount] = useState<Account | null>(null);
	const [deletingAccount, setDeletingAccount] = useState<Account | null>(null);

	const deleteAccount = useMutation(api.accounts.deleteAccount);
	const toggleAccountStatus = useMutation(api.accounts.toggleAccountStatus);

	const handleDelete = async () => {
		if (!deletingAccount) return;

		try {
			await deleteAccount({ id: deletingAccount._id as any });
			toast.success("Conta excluída com sucesso");
			setDeletingAccount(null);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Falha ao excluir conta");
		}
	};

	const handleToggleStatus = async (account: Account) => {
		try {
			await toggleAccountStatus({ id: account._id as any });
			toast.success(`Conta ${account.isActive ? 'desativada' : 'ativada'} com sucesso`);
		} catch (error) {
			toast.error("Falha ao atualizar status da conta");
		}
	};

	const buildHierarchy = (accounts: Account[]) => {
		const accountMap = new Map<string, Account & { children: Account[], level: number }>();
		const rootAccounts: (Account & { children: Account[], level: number })[] = [];

		accounts.forEach(account => {
			accountMap.set(account._id, { ...account, children: [], level: 0 });
		});

		accounts.forEach(account => {
			const accountWithChildren = accountMap.get(account._id)!;

			if (account.parentId) {
				const parent = accountMap.get(account.parentId);
				if (parent) {
					parent.children.push(accountWithChildren);
					accountWithChildren.level = parent.level + 1;
				} else {
					rootAccounts.push(accountWithChildren);
				}
			} else {
				rootAccounts.push(accountWithChildren);
			}
		});

		const typeOrder = { asset: 0, liability: 1, equity: 2 };
		rootAccounts.sort((a, b) => {
			if (a.type !== b.type) {
				return typeOrder[a.type] - typeOrder[b.type];
			}
			return a.code.localeCompare(b.code);
		});

		const flattenHierarchy = (accounts: (Account & { children: Account[], level: number })[]): Account[] => {
			const result: Account[] = [];

			const processAccount = (account: Account & { children: Account[], level: number }) => {
				result.push(account);
				account.children.sort((a, b) => a.code.localeCompare(b.code));
				account.children.map(child => processAccount(child as Account & { children: Account[], level: number }));
			};

			accounts.forEach(processAccount);
			return result;
		};

		return flattenHierarchy(rootAccounts);
	};

	const hierarchicalAccounts = buildHierarchy(accounts);

	return (
		<>
			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Código</TableHead>
							<TableHead>Nome</TableHead>
							<TableHead>Tipo</TableHead>
							<TableHead>Descrição</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="w-[70px]">Ações</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{hierarchicalAccounts.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
									Nenhuma conta encontrada. Crie sua primeira conta para começar.
								</TableCell>
							</TableRow>
						) : (
							hierarchicalAccounts.map((account) => {
								const level = (account as any).level || 0;
								const indentClass = level > 0 ? `pl-${level * 6}` : "";

								return (
									<TableRow key={account._id}>
										<TableCell className={`font-medium font-mono ${indentClass}`}>
											{level > 0 && (
												<span className="inline-block w-4 text-muted-foreground">↳</span>
											)}
											{account.code}
										</TableCell>
										<TableCell className={`font-medium ${indentClass}`}>
											{account.name}
										</TableCell>
										<TableCell>
											<Badge className={getAccountTypeColor(account.type)}>
												{getAccountTypeLabel(account.type)}
											</Badge>
										</TableCell>
										<TableCell className="max-w-xs truncate">
											{account.description || "-"}
										</TableCell>
										<TableCell>
											<Badge className={getStatusColor(account.isActive)}>
												{getStatusLabel(account.isActive)}
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
													<DropdownMenuItem onClick={() => setEditingAccount(account)}>
														<Edit className="mr-2 size-4" />
														Editar
													</DropdownMenuItem>
													<DropdownMenuItem onClick={() => handleToggleStatus(account)}>
														{account.isActive ? (
															<>
																<EyeOff className="mr-2 size-4" />
																Desativar
															</>
														) : (
															<>
																<Eye className="mr-2 size-4" />
																Ativar
															</>
														)}
													</DropdownMenuItem>
													<DropdownMenuItem
														onClick={() => setDeletingAccount(account)}
														className="text-red-600 focus:text-red-600"
													>
														<Trash2 className="mr-2 size-4" />
														Excluir
													</DropdownMenuItem>
												</DropdownMenuContent>
											</DropdownMenu>
										</TableCell>
									</TableRow>
								);
							})
						)}
					</TableBody>
				</Table>
			</div>

			<AccountForm
				open={!!editingAccount}
				onOpenChange={(open) => !open && setEditingAccount(null)}
				mode="edit"
				account={editingAccount}
			/>

			<AlertDialog open={!!deletingAccount} onOpenChange={(open) => !open && setDeletingAccount(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Excluir Conta</AlertDialogTitle>
						<AlertDialogDescription>
							Tem certeza de que deseja excluir "{deletingAccount?.name}"? Esta ação não pode ser desfeita.
							A conta será removida permanentemente do seu plano de contas.
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
