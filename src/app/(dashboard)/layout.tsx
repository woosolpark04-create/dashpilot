export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen">
      {/* Sidebar + topbar shell planned for Phase 2 */}
      <main className="p-6">{children}</main>
    </div>
  );
}
