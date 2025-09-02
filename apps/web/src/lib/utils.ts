import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function getAccountTypeColor(type: 'asset' | 'liability' | 'equity') {
	return {
		asset: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300",
		liability: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
		equity: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300",
	}[type];
}

export function getAccountTypeLabel(type: 'asset' | 'liability' | 'equity') {
	return {
		asset: "Ativo",
		liability: "Passivo",
		equity: "Patrimônio Líquido",
	}[type];
}

export function getStatusColor(status: boolean) {
	if (status === true) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";

	return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
}

export function getStatusLabel(status: boolean) {
	if (status === true) return "Ativo";

	return "Inativo";
}