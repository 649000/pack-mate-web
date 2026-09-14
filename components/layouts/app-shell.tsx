"use client";

import { useEffect, type ReactNode } from "react";
import { LayoutProvider, useLayout } from "./layout-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { Footer } from "./footer";

function Shell({ children }: { children: ReactNode }) {
  const { sidebarCollapse } = useLayout();

  useEffect(() => {
    const bodyClass = document.body.classList;
    bodyClass.add("demo1", "sidebar-fixed", "header-fixed");

    const timer = setTimeout(() => {
      bodyClass.add("layout-initialized");
    }, 1000);

    return () => {
      bodyClass.remove(
        "demo1",
        "sidebar-fixed",
        "sidebar-collapse",
        "header-fixed",
        "layout-initialized",
      );
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapse", sidebarCollapse);
  }, [sidebarCollapse]);

  return (
    <>
      <Sidebar />
      <div className="wrapper flex grow flex-col">
        <Header />
        <main className="grow pt-5" role="content">
          <div className="container">{children}</div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <LayoutProvider>
      <Shell>{children}</Shell>
    </LayoutProvider>
  );
}
