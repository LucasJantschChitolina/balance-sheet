import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Balancete",
  description: "Balancete",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}