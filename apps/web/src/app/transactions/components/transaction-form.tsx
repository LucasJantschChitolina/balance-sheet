"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@balancete/backend/convex/_generated/api";
import type { Id, DataModel } from "@balancete/backend/convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const transactionEntrySchema = z.object({
	accountId: z.string().min(1, "Conta é obrigatória"),
	amount: z.number().min(0.01, "Valor deve ser maior que zero"),
	type: z.enum(["debit", "credit"]),
	description: z.string().optional(),
});

const transactionFormSchema = z.object({
	date: z.string().min(1, "Data é obrigatória"),
	description: z.string().optional(),
	reference: z.string().optional(),
	entries: z.array(transactionEntrySchema).min(1, "Pelo menos uma linha é obrigatória"),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

type Transaction = DataModel["transactions"]["document"] & {
	entries: DataModel["transactionEntries"]["document"][];
};

interface TransactionFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	transaction?: Transaction | null;
}

export function TransactionForm({ open, onOpenChange, mode, transaction }: TransactionFormProps) {
	const createTransaction = useMutation(api.transactions.createTransaction);
	const updateTransaction = useMutation(api.transactions.updateTransaction);
	const allAccounts = useQuery(api.accounts.getAllAccounts) || [];

	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<TransactionFormValues>({
		resolver: zodResolver(transactionFormSchema),
		defaultValues: {
			date: new Date().toISOString().split('T')[0],
			description: "",
			reference: "",
			entries: [{ accountId: "", amount: 0, type: "debit", description: "" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "entries",
	});

	// Reset form when dialog opens/closes or transaction changes
	useEffect(() => {
		if (open) {
			if (mode === "edit" && transaction) {
				form.reset({
					date: transaction.date,
					description: transaction.description || "",
					reference: transaction.reference || "",
					entries: transaction.entries.map(entry => ({
						accountId: entry.accountId,
						amount: entry.amount,
						type: entry.type,
						description: entry.description || "",
					})),
				});
			} else {
				form.reset({
					date: new Date().toISOString().split('T')[0],
					description: "",
					reference: "",
					entries: [{ accountId: "", amount: 0, type: "credit", description: "" }, { accountId: "", amount: 0, type: "debit", description: "" }],
				});
			}
		}
	}, [open, mode, transaction, form]);

	const watchedEntries = form.watch("entries");

	// Calculate totals
	const totalDebits = watchedEntries
		.filter(entry => entry.type === "debit")
		.reduce((sum, entry) => sum + (entry.amount || 0), 0);

	const totalCredits = watchedEntries
		.filter(entry => entry.type === "credit")
		.reduce((sum, entry) => sum + (entry.amount || 0), 0);

	const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

	const onSubmit = async (values: TransactionFormValues) => {
		try {
			setIsSubmitting(true);

			const submitValues = {
				...values,
				entries: values.entries.map(entry => ({
					...entry,
					accountId: entry.accountId as Id<"accounts">,
				})),
			};

			if (mode === "create") {
				await createTransaction(submitValues);
				toast.success("Lançamento criado com sucesso");
			} else if (mode === "edit" && transaction) {
				await updateTransaction({
					id: transaction._id,
					...submitValues,
				});
				toast.success("Lançamento atualizado com sucesso");
			}

			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Erro ao salvar lançamento");
		} finally {
			setIsSubmitting(false);
		}
	};

	const addEntry = () => {
		append({ accountId: "", amount: 0, type: "debit", description: "" });
	};

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		}).format(amount);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-h-[90vh] min-w-[800px] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
            {mode === "create" ? "Novo Lançamento Contábil" : "Editar Lançamento"}
          </DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Registre uma nova transação financeira com suas linhas de débito e crédito."
							: "Faça alterações no lançamento contábil."
						}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
						{/* Basic Information */}
						<div className="grid gap-4 grid-cols-1 md:grid-cols-3">
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Data</FormLabel>
										<FormControl>
											<Input type="date" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="reference"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Referência</FormLabel>
										<FormControl>
											<Input placeholder="Número do documento, NF, etc." {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Descrição</FormLabel>
										<FormControl>
											<Input placeholder="Descrição da transação" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Transaction Entries */}
						<Card>
							<CardHeader>
								<div className="flex items-center justify-between">
									<CardTitle className="text-lg">Linhas do Lançamento</CardTitle>
									<Button type="button" onClick={addEntry} size="sm">
										<Plus className="mr-2 size-4" />
										Adicionar Linha
									</Button>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								{fields.map((field, index) => (
									<div key={field.id} className="grid grid-cols-1 gap-4 border-b px-4 py-6 md:grid-cols-12">
										<FormField
											control={form.control}
											name={`entries.${index}.accountId`}
											render={({ field }) => (
												<FormItem className="md:col-span-4">
													<FormLabel>Conta</FormLabel>
													<Select onValueChange={field.onChange} value={field.value}>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue placeholder="Selecione uma conta" />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															{allAccounts.map((account) => (
																<SelectItem key={account._id} value={account._id}>
																	{account.code} - {account.name}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`entries.${index}.type`}
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Tipo</FormLabel>
													<Select onValueChange={field.onChange} value={field.value}>
														<FormControl>
															<SelectTrigger className="w-full">
																<SelectValue />
															</SelectTrigger>
														</FormControl>
														<SelectContent>
															<SelectItem value="debit">Débito</SelectItem>
															<SelectItem value="credit">Crédito</SelectItem>
														</SelectContent>
													</Select>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`entries.${index}.amount`}
											render={({ field }) => (
												<FormItem className="md:col-span-2">
													<FormLabel>Valor</FormLabel>
													<FormControl>
														<Input
															type="number"
															step="0.01"
															min="0"
															placeholder="0,00"
															className="w-full"
															{...field}
															onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name={`entries.${index}.description`}
											render={({ field }) => (
												<FormItem className="md:col-span-3">
													<FormLabel>Descrição</FormLabel>
													<FormControl>
														<Input placeholder="Detalhes da linha" className="w-full" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<div className="flex items-end col-span-1">
												<Button
													disabled={fields.length === 1}
													type="button"
													variant="outline"
													size="icon"
													onClick={() => remove(index)}
												>
													<Trash2 className="size-4" />
												</Button>
										</div>
									</div>
								))}
							</CardContent>
						</Card>

						{/* Balance Summary */}
						<Card>
							<CardContent>
								<div className="flex items-center justify-between">
									<div className="space-y-1">
										<div className="font-medium text-sm">Resumo do Lançamento</div>
										<div className="flex gap-4 text-sm">
											<span>Total Débitos: <span className="font-medium text-blue-600">{formatCurrency(totalDebits)}</span></span>
											<span>Total Créditos: <span className="font-medium text-green-600">{formatCurrency(totalCredits)}</span></span>
											<span>Diferença: <span className={`${isBalanced ? 'text-green-600' : 'text-red-600'} font-medium`}>
												{formatCurrency(Math.abs(totalDebits - totalCredits))}
											</span></span>
										</div>
									</div>
									<Badge variant={isBalanced ? "outline" : "destructive"}>
										{isBalanced ? "Balanceado" : "Desbalanceado"}
									</Badge>
								</div>
							</CardContent>
						</Card>

						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								disabled={isSubmitting || !isBalanced}
							>
								{isSubmitting ? "Salvando..." : mode === "create" ? "Criar Lançamento" : "Atualizar Lançamento"}
							</Button>
						</div>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
