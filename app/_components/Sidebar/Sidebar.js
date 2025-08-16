// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import "./Sidebar.css";
// import Image from "next/image";

// export default function Sidebar() {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <>
//       {/* زر فتح القائمة في الموبايل */}
//       <button
//         className="btn btn-outline-secondary d-md-none m-3 position-fixed z-3"
//         style={{ right: "10px", top: "10px" }}
//         onClick={() => setIsOpen(true)}
//         aria-label="فتح القائمة"
//       >
//         <i className="bi bi-list"></i>
//       </button>

//       {isOpen && (
//         <div
//           className="sidebar-backdrop"
//           onClick={() => setIsOpen(false)}
//         ></div>
//       )}

//       <nav className={`sidebar ${isOpen ? "open" : ""}`}>
//         <div className="d-flex justify-content-between align-items-center mb-4">
//           <Image
//             src="/logo.jpg"
//             alt="وصف الصورة"
//             width={100}
//             height={100}
//             className="rounded-circle m-auto"
//           />

//           <button
//             className="btn-close d-md-none"
//             onClick={() => setIsOpen(false)}
//           ></button>
//         </div>

//         <ul className="nav flex-column">
//           <li className="nav-item">
//             <Link href="/statistics" className="nav-link">
//               <i className="bi bi-house-door me-2"></i> الرئيسية
//             </Link>
//           </li>

//           <li className="nav-item">
//             <Link href="/vacancy" className="nav-link">
//               <i className="bi bi-people me-2"></i>الشواغر
//             </Link>
//           </li>

//           <li className="nav-item">
//             <Link href="/projects" className="nav-link">
//               <i className="bi bi-kanban me-2"></i> مشاريعنا
//             </Link>
//           </li>

//           <li className="nav-item">
//             <Link href="/news" className="nav-link">
//               <i className="bi bi-newspaper me-2"></i> الأخبار
//             </Link>
//           </li>

//           <li className="nav-item">
//             <Link href="/courses" className="nav-link">
//               <i className="bi bi-journal-code me-2"></i> الدورات
//             </Link>
//           </li>

//           <li className="nav-item">
//             <Link href="/users" className="nav-link">
//               <i className="bi bi-people me-2 "></i> المستخدمون
//             </Link>
//           </li>
//           <li className="nav-item mt-3">
//             <button
//               className="btn btn-outline-danger w-100"
//               onClick={() => {
//                 localStorage.removeItem("token"); // حذف التوكن
//                 window.location.href = "/login"; // توجيه إلى صفحة تسجيل الدخول
//               }}
//             >
//               <i className="bi bi-box-arrow-right me-2"></i> تسجيل الخروج
//             </button>
//           </li>
//         </ul>
//       </nav>
//     </>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import "./Sidebar.css";
import Image from "next/image";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [allowedSections, setAllowedSections] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setAllowedSections(payload.allowedSections || []);
        setRole(payload.role || "");
      } catch (err) {
        console.error("فشل في قراءة التوكن:", err);
      }
    }
  }, []);

  // كل عناصر الـ Sidebar مع القسم المسموح
  const menuItems = [
    {
      section: "statistics",
      label: "الرئيسية",
      icon: "house-door",
      href: "/statistics",
    },
    {
      section: "vacancies",
      label: "الشواغر",
      icon: "people",
      href: "/vacancy",
    },
    {
      section: "projects",
      label: "مشاريعنا",
      icon: "kanban",
      href: "/projects",
    },
    { section: "news", label: "الأخبار", icon: "newspaper", href: "/news" },
    {
      section: "courses",
      label: "الدورات",
      icon: "journal-code",
      href: "/courses",
    },
    { section: "users", label: "المستخدمون", icon: "people", href: "/users" },
  ];

  // فلترة العناصر إذا لم يكن Admin
  const visibleItems =
    role === "admin"
      ? menuItems
      : menuItems.filter((item) => allowedSections.includes(item.section));

  return (
    <>
      {/* زر فتح القائمة في الموبايل */}
      <button
        className="btn btn-outline-secondary d-md-none m-3 position-fixed z-3"
        style={{ right: "10px", top: "10px" }}
        onClick={() => setIsOpen(true)}
        aria-label="فتح القائمة"
      >
        <i className="bi bi-list"></i>
      </button>

      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      <nav className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <Image
            src="/logo.jpg"
            alt="شعار"
            width={100}
            height={100}
            className="rounded-circle m-auto"
          />

          <button
            className="btn-close d-md-none"
            onClick={() => setIsOpen(false)}
          ></button>
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
