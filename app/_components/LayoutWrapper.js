"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar/Sidebar";
import BootstrapJS from "./BootstrapJS";

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/login";

  return (
    <>
      {!hideSidebar && <Sidebar />}
      <div
        className="page-content"
        style={{ marginRight: hideSidebar ? 0 : "275px" }}
      >
        {children}
      </div>
      <BootstrapJS />
    </>
  );
}
