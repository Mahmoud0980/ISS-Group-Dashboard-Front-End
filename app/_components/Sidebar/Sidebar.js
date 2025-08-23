"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./Sidebar.css";
import Image from "next/image";

function decodeJwt(token) {
  const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
  const json = decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
  return JSON.parse(json);
}

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [allowedSections, setAllowedSections] = useState([]);
  const [role, setRole] = useState("");
  const [isSuper, setIsSuper] = useState(false); // ⬅️ سوبر أدمن

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const payload = decodeJwt(token);
      setAllowedSections(payload.allowedSections || []);
      setRole(payload.role || "");
      // اعتبر DaniaM أو isProtected = super admin
      setIsSuper(
        payload.username === "DaniaM" || payload.isProtected === true
      );
    } catch (err) {
      console.error("فشل في قراءة التوكن:", err);
    }
  }, []);

  const menuItems = [
    { section: "statistics", label: "الرئيسية", icon: "house-door", href: "/statistics" },
    { section: "vacancies",  label: "الشواغر",   icon: "people",     href: "/vacancy" },
    { section: "projects",   label: "مشاريعنا",  icon: "kanban",     href: "/projects" },
    { section: "news",       label: "الأخبار",   icon: "newspaper",  href: "/news" },
    { section: "courses",    label: "الدورات",   icon: "journal-code", href: "/courses" },
    { section: "users",      label: "المستخدمون", icon: "people",    href: "/users" },
  ];


  const visibleItems = isSuper
    ? menuItems
    : menuItems.filter((item) => allowedSections.includes(item.section));

  return (
    <>
      <button
        className="btn btn-outline-secondary d-md-none m-3 position-fixed z-3"
        style={{ right: "10px", top: "10px" }}
        onClick={() => setIsOpen(true)}
        aria-label="فتح القائمة"
      >
        <i className="bi bi-list"></i>
      </button>

      {isOpen && <div className="sidebar-backdrop" onClick={() => setIsOpen(false)}></div>}

      <nav className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Image src="/logo.jpg" alt="شعار" width={100} height={100} className="rounded-circle m-auto" />
          <button className="btn-close d-md-none" onClick={() => setIsOpen(false)}></button>
        </div>

        <ul className="nav flex-column">
          {visibleItems.map((item) => (
            <li className="nav-item p-1" key={item.section}>
              <Link href={item.href} className="nav-link">
                <i className={`bi bi-${item.icon} me-2`}></i> {item.label}
              </Link>
            </li>
          ))}
          <li className="nav-item mt-3">
            <button
              className="btn btn-outline-danger w-100"
              onClick={() => {
                localStorage.removeItem("token");
                window.location.href = "/login";
              }}
            >
              <i className="bi bi-box-arrow-right me-2"></i> تسجيل الخروج
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
