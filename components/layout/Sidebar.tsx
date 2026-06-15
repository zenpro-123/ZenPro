import { SidebarNav } from "@/components/layout/SidebarNav";

/** Fixed desktop sidebar. Mobile navigation is handled by `MobileSidebar` in the header. */
export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-sidebar lg:block">
      <SidebarNav />
    </aside>
  );
}
