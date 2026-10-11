"use client";

import * as React from "react";
import { GitPullRequest, LayoutDashboard, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { useWorkspace } from "@/components/dashboard/use-workspace";
import { Brand } from "./brand";
import { NavUser } from "./nav-user";

const items = [
  { title: "Overview", to: "/dashboard", icon: LayoutDashboard },
  { title: "Changes", to: "/dashboard/changes", icon: GitPullRequest },
  { title: "Settings", to: "/dashboard/settings", icon: Settings2 },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const reviewCount = useWorkspace(
    (workspace) =>
      workspace.changes.filter((change) => change.status === "Review").length,
  );

  const compact = state === "collapsed" && !isMobile;
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-2">
        <Brand compact={compact} />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu aria-label="Workspace navigation">
            {items.map((item) => {
              const isActive =
                item.to === "/dashboard"
                  ? normalizedPath === "/dashboard"
                  : normalizedPath === item.to ||
                    normalizedPath.startsWith(`${item.to}/`);

              return (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    render={
                      <Link
                        href={item.to}
                        onClick={() => setOpenMobile(false)}
                      />
                    }
                    tooltip={item.title}
                    isActive={isActive}
                    className="w-full"
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>

                  {item.title === "Changes" && reviewCount > 0 && (
                    <SidebarMenuBadge>{reviewCount}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      <SidebarFooter>
        <NavUser
          user={{
            email: "test@test.com",
            avatar: "https://github.com/shadcn.png",
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
