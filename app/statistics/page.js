"use client";
import { useEffect, useState } from "react";
import ProtectedRoute from "../_components/ProtectedRoute";
export default function DashboardPage() {
  const [stats, setStats] = useState({
    coursesCount: 0,
    projectsCount: 0,
    vacanciesCount: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/stats"
      );
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("فشل في جلب الإحصائيات", err);
    }
  };

  return (
    <ProtectedRoute allowed="statistics">
      <div className="container py-1 mb-2">
        <h2 className="fw-bold" style={{ color: "#1e293b", marginTop: "40px" }}>
          <i className="bi bi-bar-chart-line-fill me-2"></i> لوحة الإحصائيات
        </h2>

        <div className="row g-4 mt-2">
          <div className="col-md-4">
            <div className="card text-center shadow-sm border-0 bg-white">
              <div className="card-body">
                <i className="bi bi-journal-code fs-1 text-primary"></i>
                <h5 className="mt-3">الدورات</h5>
                <h2>{stats.coursesCount}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-center shadow-sm border-0 bg-white">
              <div className="card-body">
                <i className="bi bi-laptop fs-1 text-success"></i>
                <h5 className="mt-3">المشاريع</h5>
                <h2>{stats.projectsCount}</h2>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card text-center shadow-sm border-0 bg-white">
              <div className="card-body">
                <i className="bi bi-briefcase fs-1 text-danger"></i>
                <h5 className="mt-3">الشواغر</h5>
                <h2>{stats.vacanciesCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center shadow-sm border-0 bg-white">
              <div className="card-body">
                <i className="bi bi-newspaper fs-1 text-warning"></i>
                <h5 className="mt-3">الأخبار</h5>
                <h2>{stats.newsCount}</h2>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card text-center shadow-sm border-0 bg-white">
              <div className="card-body">
                <i className="bi bi-people fs-1 text-info"></i>
                <h5 className="mt-3">المستخدمين</h5>
                <h2>{stats.userCount}</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
