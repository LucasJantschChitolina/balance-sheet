"use client";

import { ModeToggle } from "./mode-toggle";
import { SidebarTrigger } from "./ui/sidebar";

export default function Header() {
		return (
		<div className="flex w-full flex-row items-center justify-between border-b px-2 py-1">
			<SidebarTrigger />

			<div className="flex items-center gap-2">
				<ModeToggle />
			</div>
		</div>
	);
}
