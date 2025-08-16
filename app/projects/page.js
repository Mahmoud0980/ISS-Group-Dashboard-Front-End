"use client";
import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../_components/ProtectedRoute";
import Alerts from "../_components/Alerts";

const STATUS = ["قريبا", "منجز", "قيد التحديث"];

// تحويل تاريخ JS إلى قيمة مناسبة لـ <input type="date">
const toInputDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [editProject, setEditProject] = useState(null);
  const [alertData, setAlertData] = useState(null);

  const [newProject, setNewProject] = useState({
    title_ar: "",
    title_en: "",
    slug: "",
    description_ar: "",
    description_en: "",
    company: "",
    startDate: "",
    status: "",
    link: "",
    image: null, // file
  });

  // modal refs + hidden close buttons
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);
  const addCloseBtnRef = useRef(null);
  const editCloseBtnRef = useRef(null);

  const cleanupBackdrop = () => {
    document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
  };

  useEffect(() => {
    const addEl = addModalRef.current;
    const editEl = editModalRef.current;

    const onAddHidden = () => {
      setNewProject({
        title_ar: "",
        title_en: "",
        slug: "",
        description_ar: "",
        description_en: "",
        company: "",
        startDate: "",
        status: "",
        link: "",
        image: null,
      });
      cleanupBackdrop();
    };

    const onEditHidden = () => {
      setEditProject(null);
      cleanupBackdrop();
    };

    addEl?.addEventListener("hidden.bs.modal", onAddHidden);
    editEl?.addEventListener("hidden.bs.modal", onEditHidden);
    return () => {
      addEl?.removeEventListener("hidden.bs.modal", onAddHidden);
      editEl?.removeEventListener("hidden.bs.modal", onEditHidden);
    };
  }, []);

  // Fetch
  const fetchProjects = async () => {
    try {
      const res = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/projects"
      );
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlertData({
        body: "فشل في جلب المشاريع",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2200);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Helpers
  const generateSlug = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  // Add form handlers
  const handleChangeAdd = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setNewProject((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }
    let updated = { ...newProject, [name]: value };
    if (name === "title_en") {
      updated.slug = generateSlug(value);
    }
    setNewProject(updated);
  };

  // Edit form handlers
  const handleChangeEdit = (e) => {
    const { name, value, files } = e.target;
    if (!editProject) return;
    if (files) {
      setEditProject((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }
    let updated = { ...editProject, [name]: value };
    if (name === "title_en") {
      updated.slug = generateSlug(value);
    }
    setEditProject(updated);
  };

  // Submit add
  const handleSubmit = async (e) => {
    e.preventDefault();
    // basic checks
    const req = [
      "title_ar",
      "title_en",
      "slug",
      "description_ar",
      "description_en",
      "company",
      "startDate",
      "status",
      "link",
    ];
    for (const f of req) {
      if (!newProject[f]) {
        setAlertData({
          body: `الحقل ${f} مفقود`,
          className: "alert alert-danger position-fixed top-0-0",
        });
        setTimeout(() => setAlertData(null), 2200);
        return;
      }
    }
    if (!newProject.image) {
      setAlertData({
        body: "الرجاء اختيار صورة",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2200);
      return;
    }

    try {
      const form = new FormData();
      Object.entries(newProject).forEach(([k, v]) => form.append(k, v));
      const res = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/projects",
        {
          method: "POST",
          body: form,
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل في الإضافة");

      setAlertData({
        body: "تم إضافة المشروع بنجاح",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 1500);
      fetchProjects();
      addCloseBtnRef.current?.click();
    } catch (err) {
      setAlertData({
        body: err.message || "حدث خطأ أثناء الإضافة",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2200);
    }
  };

  // Submit edit
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editProject?._id) return;

    try {
      const form = new FormData();
      // نضيف كل القيم، ولو الصورة ملف جديد حيتم رفعه وإلا تبقى القديمة
      Object.entries(editProject).forEach(([k, v]) => form.append(k, v));
      const res = await fetch(
        `https://iss-group-dashboard-2.onrender.com/api/projects/${editProject._id}`,
        { method: "PUT", body: form }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل في التعديل");

      setAlertData({
        body: "تم تعديل المشروع",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 1500);
      fetchProjects();
      editCloseBtnRef.current?.click();
    } catch (err) {
      setAlertData({
        body: err.message || "حدث خطأ أثناء التعديل",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2200);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      const res = await fetch(
        `https://iss-group-dashboard-2.onrender.com/api/projects/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل في الحذف");

      setAlertData({
        body: "تم حذف المشروع",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 1500);
      fetchProjects();
    } catch (err) {
      setAlertData({
        body: err.message || "حدث خطأ أثناء الحذف",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2200);
    }
  };

  return (
    <ProtectedRoute allowed="projects">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className="fw-bold" style={{ color: "#1e293b" }}>
            <i className="bi bi-kanban me-2"></i> إدارة المشاريع
          </h2>
          {alertData && (
            <Alerts body={alertData.body} className={alertData.className} />
          )}
          <button
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#addProjectModal"
          >
            <i className="bi bi-plus-circle me-1"></i> إضافة مشروع
          </button>
        </div>

        {/* جدول عرض المشاريع */}
        <div className="table-responsive shadow p-3 mb-5 bg-body rounded">
          <table className="table table-hover align-middle mb-0 bg-white text-center">
            <thead className="bg-light">
              <tr>
                <th>العنوان</th>
                <th>الشركة</th>
                <th>تاريخ البدء</th>
                <th>الحالة</th>
                <th>الرابط</th>
                <th>تحكم</th>
              </tr>
            </thead>
            <tbody>
              {projects.length > 0 ? (
                projects.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <div className="fw-bold">{p.title_ar}</div>
                      <div className="text-muted small">{p.title_en}</div>
                    </td>
                    <td>{p.company}</td>
                    <td>{toInputDate(p.startDate)}</td>
                    <td>
                      <span className="badge bg-info">{p.status}</span>
                    </td>
                    <td>
                      <a
                        href={p.link}
                        className="btn btn-sm btn-outline-primary"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="bi bi-link-45deg"></i> فتح
                      </a>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#editProjectModal"
                        onClick={() =>
                          setEditProject({
                            ...p,
                            startDate: toInputDate(p.startDate), // لملئ input date مباشرة
                          })
                        }
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(p._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-muted py-4">
                    لا توجد مشاريع حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* مودال إضافة مشروع */}
        <div
          ref={addModalRef}
          className="modal fade"
          id="addProjectModal"
          tabIndex="-1"
          aria-labelledby="addProjectModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title" id="addProjectModalLabel">
                  إضافة مشروع{" "}
                  {newProject.slug && (
                    <span className="text-muted fs-6">/ {newProject.slug}</span>
                  )}
                </h5>
                <button
                  type="button"
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
                      value={newProject.title_ar}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title (EN)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title_en"
                      value={newProject.title_en}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>

                  {/* الوصف */}
                  <div className="col-md-6">
                    <label className="form-label">الوصف (AR)</label>
                    <textarea
                      className="form-control"
                      name="description_ar"
                      rows="2"
                      value={newProject.description_ar}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Description (EN)</label>
                    <textarea
                      className="form-control"
                      name="description_en"
                      rows="2"
                      value={newProject.description_en}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>

                  {/* الشركة + تاريخ البدء */}
                  <div className="col-md-6">
                    <label className="form-label">الشركة الهادفة</label>
                    <input
                      type="text"
                      className="form-control"
                      name="company"
                      value={newProject.company}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">تاريخ البدء</label>
                    <input
                      type="date"
                      className="form-control"
                      name="startDate"
                      value={newProject.startDate}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>

                  {/* الحالة */}
                  <div className="col-md-6">
                    <label className="form-label">حالة المشروع</label>
                    <select
                      className="form-select"
                      name="status"
                      value={newProject.status}
                      onChange={handleChangeAdd}
                      required
                    >
                      <option value="">اختر الحالة</option>
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* الرابط */}
                  <div className="col-md-6">
                    <label className="form-label">رابط المشروع</label>
                    <input
                      type="text"
                      className="form-control"
                      name="link"
                      value={newProject.link}
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>

                  {/* الصورة */}
                  <div className="col-md-6">
                    <label className="form-label">تحميل صورة</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      accept="image/*"
                      onChange={handleChangeAdd}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  إلغاء
                </button>
                <button className="btn btn-primary" type="submit">
                  حفظ المشروع
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* مودال تعديل مشروع */}
        <div
          ref={editModalRef}
          className="modal fade"
          id="editProjectModal"
          tabIndex="-1"
          aria-labelledby="editProjectModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form className="modal-content" onSubmit={handleUpdate}>
              <div className="modal-header">
                <h5 className="modal-title" id="editProjectModalLabel">
                  تعديل مشروع{" "}
                  {editProject?.slug && (
                    <span className="text-muted fs-6">
                      / {editProject.slug}
                    </span>
                  )}
                </h5>
                <button
                  type="button"
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
                {editProject && (
                  <div className="row g-3">
                    {/* العنوان */}
                    <div className="col-md-6">
                      <label className="form-label">العنوان (AR)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title_ar"
                        value={editProject.title_ar || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Title (EN)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title_en"
                        value={editProject.title_en || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>

                    {/* الوصف */}
                    <div className="col-md-6">
                      <label className="form-label">الوصف (AR)</label>
                      <textarea
                        className="form-control"
                        name="description_ar"
                        rows="2"
                        value={editProject.description_ar || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Description (EN)</label>
                      <textarea
                        className="form-control"
                        name="description_en"
                        rows="2"
                        value={editProject.description_en || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>

                    {/* الشركة + تاريخ البدء */}
                    <div className="col-md-6">
                      <label className="form-label">الشركة الهادفة</label>
                      <input
                        type="text"
                        className="form-control"
                        name="company"
                        value={editProject.company || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">تاريخ البدء</label>
                      <input
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={editProject.startDate || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>

                    {/* الحالة */}
                    <div className="col-md-6">
                      <label className="form-label">حالة المشروع</label>
                      <select
                        className="form-select"
                        name="status"
                        value={editProject.status || ""}
                        onChange={handleChangeEdit}
                        required
                      >
                        {STATUS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* الرابط */}
                    <div className="col-md-6">
                      <label className="form-label">رابط المشروع</label>
                      <input
                        type="text"
                        className="form-control"
                        name="link"
                        value={editProject.link || ""}
                        onChange={handleChangeEdit}
                        required
                      />
                    </div>

                    {/* الصورة (اختياري استبدال) */}
                    <div className="col-md-6">
                      <label className="form-label">تغيير الصورة</label>
                      <input
                        type="file"
                        className="form-control"
                        name="image"
                        accept="image/*"
                        onChange={handleChangeEdit}
                      />
                      {typeof editProject.image === "string" &&
                        editProject.image && (
                          <div className="form-text mt-1">
                            الصورة الحالية:{" "}
                            <a
                              href={editProject.image}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              فتح الصورة الحالية
                            </a>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
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
