"use client";

export default function Home() {
	return (
		<div className="flex h-full w-full flex-col items-center justify-center space-y-4 font-mono">
			<h1 className="font-bold text-3xl">Em desenvolvimento 🚧</h1>
			
			<span className="flex items-center gap-1 text-muted-foreground">Volte mais tarde <span className="animate-pulse rounded-full bg-red-500 p-1" /></span>
		</div>
	);
}
