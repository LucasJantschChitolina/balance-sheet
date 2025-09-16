import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impostos Apurados",
  description: "Impostos Apurados",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}