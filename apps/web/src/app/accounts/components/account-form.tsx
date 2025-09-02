"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "@balancete/backend/convex/_generated/api";
import type { Id, DataModel } from "@balancete/backend/convex/_generated/dataModel";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const accountFormSchema = z.object({
	name: z.string().min(1, "Nome da conta é obrigatório").max(100, "Nome muito longo"),
	code: z.string().min(1, "Código da conta é obrigatório").max(20, "Código muito longo"),
	type: z.enum(["asset", "liability", "equity"]),
	parentId: z.union([z.string(), z.literal("none")]).optional().nullable(),
	description: z.string().optional(),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

type Account = DataModel["accounts"]['document'];

interface AccountFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	mode: "create" | "edit";
	account?: Account | null;
}

export function AccountForm({ open, onOpenChange, mode, account }: AccountFormProps) {
	const createAccount = useMutation(api.accounts.createAccount);
	const updateAccount = useMutation(api.accounts.updateAccount);
	const allAccounts = useQuery(api.accounts.getAllAccounts) || [];

	const form = useForm<AccountFormValues>({
		resolver: zodResolver(accountFormSchema),
		defaultValues: {
			name: "",
			code: "",
			type: "asset",
			parentId: null,
			description: "",
		},
	});

	const isSubmitting = form.formState.isSubmitting;

	useEffect(() => {
		if (open) {
			if (mode === "edit" && account) {
				form.reset({
					name: account.name,
					code: account.code,
					type: account.type,
					parentId: account.parentId || null,
					description: account.description || "",
				});
			} else {
				form.reset({
					name: "",
					code: "",
					type: "asset",
					parentId: null,
					description: "",
				});
			}
		}
	}, [open, mode, account, form]);

	const getAvailableParents = () => {
		if (!allAccounts.length) return [];

		if (mode === "edit" && account) {
			const descendants = new Set<string>();

			const findDescendants = (parentId: string) => {
				allAccounts.forEach(acc => {
					if (acc.parentId === parentId) {
						descendants.add(acc._id);
						findDescendants(acc._id);
					}
				});
			};

			findDescendants(account._id);

			return allAccounts.filter(acc =>
				acc._id !== account._id && !descendants.has(acc._id)
			);
		}

		return allAccounts;
	};

	const availableParents = getAvailableParents();

	const onSubmit = async (values: AccountFormValues) => {
		try {
			const submitValues = {
				...values,
				parentId: values.parentId === "none" || !values.parentId ? undefined : values.parentId as Id<"accounts">,
			};

			if (mode === "create") {
				await createAccount(submitValues);
				toast.success("Conta criada com sucesso");
			} else if (mode === "edit" && account) {
				await updateAccount({
					id: account._id as Id<"accounts">,
					...submitValues,
				});
				toast.success("Conta atualizada com sucesso");
			}

			onOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Ocorreu um erro");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{mode === "create" ? "Criar Nova Conta" : "Editar Conta"}
					</DialogTitle>
					<DialogDescription>
						{mode === "create"
							? "Adicione uma nova conta ao seu plano de contas."
							: "Faça alterações nos detalhes da conta."
						}
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Nome da Conta</FormLabel>
									<FormControl>
										<Input placeholder="ex.: Caixa, Contas a Receber" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="code"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Código da Conta</FormLabel>
									<FormControl>
										<Input placeholder="ex.: 1001, CAIXA" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Tipo de Conta</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione o tipo de conta" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="asset">Ativo</SelectItem>
											<SelectItem value="liability">Passivo</SelectItem>
											<SelectItem value="equity">Patrimônio Líquido</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="parentId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Conta Pai (Opcional)</FormLabel>
									<Select
										onValueChange={field.onChange}
										value={field.value || "none"}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Selecione a conta pai" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="none">Sem pai (Nível superior)</SelectItem>
											{availableParents.map((parentAccount) => (
												<SelectItem key={parentAccount._id} value={parentAccount._id}>
													{parentAccount.code} - {parentAccount.name}
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
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Descrição (Opcional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Detalhes adicionais sobre esta conta..."
											className="resize-none"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => onOpenChange(false)}
								disabled={isSubmitting}
							>
								Cancelar
							</Button>
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								{mode === "create" ? "Criar Conta" : "Atualizar Conta"}
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
