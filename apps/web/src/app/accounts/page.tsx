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
import { AccountsTable } from "./components/accounts-table";
import { AccountForm } from "./components/account-form";
import { api } from "@balancete/backend/convex/_generated/api";

type AccountType = "asset" | "liability" | "equity";

export default function AccountsPage() {
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedType, setSelectedType] = useState<AccountType | "all">("all");
	const [showCreateForm, setShowCreateForm] = useState(false);

	const allAccounts = useQuery(api.accounts.getAllAccounts) || [];
	const activeAccounts = useQuery(api.accounts.getActiveAccounts) || [];

	const filteredAccounts = allAccounts.filter((account) => {
		const matchesSearch =
			account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			account.code.toLowerCase().includes(searchTerm.toLowerCase());
		const matchesType = selectedType === "all" || account.type === selectedType;
		return matchesSearch && matchesType;
	});

	const accountStats = {
		total: allAccounts.length,
		active: activeAccounts.length,
		assets: allAccounts.filter((a) => a.type === "asset").length,
		liabilities: allAccounts.filter((a) => a.type === "liability").length,
		equity: allAccounts.filter((a) => a.type === "equity").length,
	};

	return (
		<div className="container mx-auto">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl">Gerenciamento de Contas</h1>
					<p className="text-muted-foreground">
						Gerencie seu plano de contas com contas de ativo, passivo e patrimônio
						líquido
					</p>
				</div>
				<Button onClick={() => setShowCreateForm(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Criar Conta
				</Button>
			</div>

			<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Total de Contas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl">{accountStats.total}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Contas Ativas
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-green-600">
							{accountStats.active}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">Ativos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-blue-600">
							{accountStats.assets}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="font-medium text-sm">
							Passivos e Patrimônio
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="font-bold text-2xl text-orange-600">
							{accountStats.liabilities + accountStats.equity}
						</div>
					</CardContent>
				</Card>
			</div>

			<div className="mb-6 flex flex-col gap-4 sm:flex-row">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 transform text-muted-foreground" />
					<Input
						placeholder="Pesquisar contas por nome ou código..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<Tabs
					value={selectedType}
					onValueChange={(value) =>
						setSelectedType(value as AccountType | "all")
					}
				>
					<TabsList>
						<TabsTrigger value="all">Todas</TabsTrigger>
						<TabsTrigger value="asset">Ativos</TabsTrigger>
						<TabsTrigger value="liability">Passivos</TabsTrigger>
						<TabsTrigger value="equity">Patrimônio</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Plano de Contas</CardTitle>
					<CardDescription>
						Mostrando {filteredAccounts.length} de {allAccounts.length} contas
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AccountsTable accounts={filteredAccounts} />
				</CardContent>
			</Card>

			<AccountForm
				open={showCreateForm}
				onOpenChange={setShowCreateForm}
				mode="create"
			/>
		</div>
	);
}
