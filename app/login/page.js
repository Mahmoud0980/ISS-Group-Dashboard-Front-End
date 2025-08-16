"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Image from "next/image";
import Alerts from "../_components/Alerts";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [alertData, setAlertData] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/statistics"); // أو أي صفحة افتراضية بعد الدخول
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.replace("/statistics");
    } else {
      setAlertData({
        body: data.error || "فشل تسجيل الدخول",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      {alertData && (
        <Alerts body={alertData.body} className={alertData.className} />
      )}
      <div
        className="card p-4 shadow text-center"
        style={{ maxWidth: "400px", width: "100%" }}
      >
        <div className="mb-3">
          <Image
            src="/logo.jpg"
            alt="شعار الشركة"
            width={100}
            height={100}
            className="rounded-circle"
          />
        </div>

        <h4 className="mb-3">تسجيل الدخول</h4>

        <form onSubmit={handleLogin}>
          <div className="mb-3 text-start">
            <label className="form-label"> اسم المستخدم</label>
            <input
              type="text"
              className="form-control"
              placeholder="اسم المستخدم"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-3 text-start">
            <label className="form-label">كلمة المرور</label>
            <input
              type="password"
              className="form-control"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            دخول
          </button>
        </form>
      </div>
    </div>
  );
}
