import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";

// Shared shell for all app pages: sidebar + topbar stay mounted between routes
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        {children}
      </div>
    </div>
  );
}