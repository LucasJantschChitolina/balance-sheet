import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers";
import Header from "@/components/header";
import { AppSidebar } from "@/components/app-sidebar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "balancete",
	description: "balancete",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
			suppressHydrationWarning
				className={`${geistSans.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<AppSidebar />
					<div className="grid h-svh w-full grid-rows-[auto_1fr]">
						<Header />
						<div className="px-6 py-4">
							{children}
						</div>
					</div>
				</Providers>
			</body>
		</html>
	);
}
