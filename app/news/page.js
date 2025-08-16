// app/news/page.jsx
"use client";
import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../_components/ProtectedRoute";
import Alerts from "../_components/Alerts";

// حوّل قيمة تاريخ (Date أو string) إلى شكل مناسب لـ <input type="date"> => YYYY-MM-DD
const toInputDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// عرض التاريخ بشكل مقروء في الجدول (اختياري)
const humanDate = (d) => {
  if (!d) return "";
  try {
    return new Date(d).toLocaleDateString("ar-SY");
  } catch {
    return d;
  }
};

// توليد slug من نص إنكليزي
const generateSlug = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export default function NewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [editNews, setEditNews] = useState(null);
  const [alertData, setAlertData] = useState(null);
  const [newNews, setNewNews] = useState({
    title_ar: "",
    title_en: "",
    slug: "", // ✅ جديد
    summary_ar: "",
    summary_en: "",
    date: "",
  });

  // refs للمودالات + أزرار إغلاق مخفية
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);
  const addCloseBtnRef = useRef(null);
  const editCloseBtnRef = useRef(null);

  // تنظيف احتياطي لو ظلّ الـ backdrop لأي سبب
  const cleanupBackdrop = () => {
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
  };

  // reset state بعد الإغلاق الحقيقي
  useEffect(() => {
    const addEl = addModalRef.current;
    const editEl = editModalRef.current;

    const onAddHidden = () => {
      setNewNews({
        title_ar: "",
        title_en: "",
        slug: "",
        summary_ar: "",
        summary_en: "",
        date: "",
      });
      cleanupBackdrop();
    };
    const onEditHidden = () => {
      setEditNews(null);
      cleanupBackdrop();
    };

    addEl?.addEventListener("hidden.bs.modal", onAddHidden);
    editEl?.addEventListener("hidden.bs.modal", onEditHidden);
    return () => {
      addEl?.removeEventListener("hidden.bs.modal", onAddHidden);
      editEl?.removeEventListener("hidden.bs.modal", onEditHidden);
    };
  }, []);

  // جلب الأخبار
  const fetchNews = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/news?lang=ar");
      const data = await res.json();
      const normalized = (Array.isArray(data) ? data : []).map((n) => ({
        ...n,
        date: toInputDate(n.date),
      }));
      setNewsList(normalized);
    } catch (err) {
      console.error("فشل في جلب الأخبار", err);
      setAlertData({
        body: "فشل في جلب الأخبار",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // تغيير حقول الإضافة مع توليد slug
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...newNews, [name]: value };
    if (name === "title_en") {
      updated.slug = generateSlug(value); // ✅ توليد تلقائي
    }
    setNewNews(updated);
  };

  // تغيير حقول التعديل مع توليد slug
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...editNews, [name]: value };
    if (name === "title_en") {
      updated.slug = generateSlug(value); // ✅ توليد تلقائي
    }
    setEditNews(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNews), // يتضمن slug
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "فشل الإضافة");

      setAlertData({
        body: "تم إضافة الخبر",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchNews();
      addCloseBtnRef.current?.click(); // أغلق المودال
    } catch (err) {
      console.error("خطأ في الإضافة", err);

      setAlertData({
        body: "حدث خطأ أثناء الإضافة",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/news/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editNews), // يتضمن slug
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "فشل التعديل");

      setAlertData({
        body: "تم تعديل الخبر بنجاح",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchNews();
      editCloseBtnRef.current?.click(); // أغلق المودال
    } catch (err) {
      console.error("خطأ في التعديل", err);

      setAlertData({
        body: "حدث خطأ أثناء التعديل",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الخبر؟")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/news/${id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل الحذف");

      setAlertData({
        body: "تم حذف الخبر",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchNews();
    } catch (err) {
      console.error("خطأ في الحذف", err);

      setAlertData({
        body: "حدث خطأ أثناء الحذف",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  return (
    <ProtectedRoute allowed="news">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold" style={{ color: "#1e293b" }}>
            <i className="bi bi-megaphone me-2"></i>إدارة الأخبار
          </h2>
          {alertData && (
            <Alerts body={alertData.body} className={alertData.className} />
          )}
          <button
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#addNewsModal"
          >
            <i className="bi bi-plus-circle me-1"></i> إضافة خبر
          </button>
        </div>

        <div className="table-responsive shadow p-3 mb-5 bg-body rounded">
          <table className="table table-hover text-center align-middle">
            <thead className="bg-light text-center">
              <tr>
                <th>العنوان</th>
                <th>التاريخ</th>
                <th>الملخص</th>
                <th>تحكم</th>
              </tr>
            </thead>
            <tbody>
              {newsList.length > 0 ? (
                newsList.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div>{item.title_ar}</div>
                      <div className="text-muted small">{item.title_en}</div>
                    </td>
                    <td>{humanDate(item.date)}</td>
                    <td>{item.summary_ar}</td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#editNewsModal"
                        onClick={() =>
                          setEditNews({
                            ...item,
                            date: toInputDate(item.date),
                          })
                        }
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(item._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-muted py-4">
                    لا توجد أخبار حالياً
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal - Add News */}
        <div
          ref={addModalRef}
          className="modal fade"
          id="addNewsModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">
                  إضافة خبر{" "}
                  {newNews.slug && (
                    <span className="text-muted fs-6">/ {newNews.slug}</span>
                  )}
                </h5>
                <button
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
                <button
                  ref={addCloseBtnRef}
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ display: "none" }}
                />
              </div>

              <div className="modal-body">
                <div className="row g-3">
                  {/* العنوان */}
                  <div className="col-md-6">
                    <label className="form-label">العنوان (AR)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title_ar"
                      value={newNews.title_ar}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title (EN)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title_en"
                      value={newNews.title_en}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* الملخص */}
                  <div className="col-md-6">
                    <label className="form-label">الملخص (AR)</label>
                    <textarea
                      className="form-control"
                      name="summary_ar"
                      rows="2"
                      value={newNews.summary_ar}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Summary (EN)</label>
                    <textarea
                      className="form-control"
                      name="summary_en"
                      rows="2"
                      value={newNews.summary_en}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* التاريخ */}
                  <div className="col-md-6">
                    <label className="form-label">التاريخ</label>
                    <input
                      type="date"
                      className="form-control"
                      name="date"
                      value={newNews.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  type="button"
                >
                  إلغاء
                </button>
                <button className="btn btn-primary" type="submit">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Modal - Edit News */}
        <div
          ref={editModalRef}
          className="modal fade"
          id="editNewsModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form
              className="modal-content"
              onSubmit={(e) => handleUpdate(e, editNews?._id)}
            >
              <div className="modal-header">
                <h5 className="modal-title">
                  تعديل خبر{" "}
                  {editNews?.slug && (
                    <span className="text-muted fs-6">/ {editNews.slug}</span>
                  )}
                </h5>
                <button
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
                <button
                  ref={editCloseBtnRef}
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ display: "none" }}
                />
              </div>

              <div className="modal-body">
                {editNews && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">العنوان (AR)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title_ar"
                        value={editNews.title_ar}
                        onChange={(e) =>
                          setEditNews({ ...editNews, title_ar: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Title (EN)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title_en"
                        value={editNews.title_en}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">الملخص (AR)</label>
                      <textarea
                        className="form-control"
                        name="summary_ar"
                        rows="2"
                        value={editNews.summary_ar}
                        onChange={(e) =>
                          setEditNews({
                            ...editNews,
                            summary_ar: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Summary (EN)</label>
                      <textarea
                        className="form-control"
                        name="summary_en"
                        rows="2"
                        value={editNews.summary_en}
                        onChange={(e) =>
                          setEditNews({
                            ...editNews,
                            summary_en: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">التاريخ</label>
                      <input
                        type="date"
                        className="form-control"
                        name="date"
                        value={editNews.date}
                        onChange={(e) =>
                          setEditNews({ ...editNews, date: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                  type="button"
                >
                  إلغاء
                </button>
                <button className="btn btn-primary" type="submit">
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
