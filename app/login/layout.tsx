import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
  title: "Login - Envio Express",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {children}
    </div>
  );
}
