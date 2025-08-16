"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProtectedRoute({ children, allowed }) {
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // ✅ السماح المطلق لـ DaniaM
      if (payload.username === "DaniaM") {
        setAuthorized(true);
        return;
      }

      // ✅ السماح للمستخدم العادي فقط إن كان القسم مسموح له
      if (payload.allowedSections?.includes(allowed)) {
        setAuthorized(true);
        return;
      }

      alert("❌ ليس لديك صلاحية الوصول إلى هذا القسم");
      router.push("/statistics");
    } catch (err) {
      console.error("فشل في تحليل التوكن:", err);
      router.push("/login");
    }
  }, [allowed, router]);

  return authorized ? <>{children}</> : null;
}
