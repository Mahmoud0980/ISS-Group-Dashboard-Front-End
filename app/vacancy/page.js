"use client";
import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "..//_components/ProtectedRoute";
import Alerts from "../_components/Alerts";

const makeSlug = (str = "") =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export default function VacanciesPage() {
  const [vacancies, setVacancies] = useState([]);
  const [editVacancy, setEditVacancy] = useState(null);
  const [alertData, setAlertData] = useState(null);

  // المتقدمون (مودال)
  const [selectedVacancyForApplicants, setSelectedVacancyForApplicants] =
    useState(null);
  const [applicants, setApplicants] = useState({
    headers: [],
    rows: [],
    tabTitle: "",
  });
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState(null);
  const [applicantsCount, setApplicantsCount] = useState(null);

  const [newVacancy, setNewVacancy] = useState({
    title_ar: "",
    title_en: "",
    description_ar: "",
    description_en: "",
    formLink: "",
    sheetLink: "",
    slug: "",
  });

  // refs للمودالات + أزرار إغلاق مخفية
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
      setNewVacancy({
        title_ar: "",
        title_en: "",
        description_ar: "",
        description_en: "",
        formLink: "",
        sheetLink: "",
        slug: "",
      });
      cleanupBackdrop();
    };
    const onEditHidden = () => {
      setEditVacancy(null);
      cleanupBackdrop();
    };
    addEl?.addEventListener("hidden.bs.modal", onAddHidden);
    editEl?.addEventListener("hidden.bs.modal", onEditHidden);
    return () => {
      addEl?.removeEventListener("hidden.bs.modal", onAddHidden);
      editEl?.removeEventListener("hidden.bs.modal", onEditHidden);
    };
  }, []);

  // API
  const fetchVacancies = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/vacancies");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "err");
      setVacancies(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      alert("فشل في جلب الشواغر");
    }
  };

  useEffect(() => {
    fetchVacancies();
  }, []);

  // Handlers (New/Edit)
  const handleNewChange = (e) => {
    const { name, value } = e.target;
    const next = { ...newVacancy, [name]: value };
    if (name === "title_en") next.slug = makeSlug(value);
    setNewVacancy(next);
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    const next = { ...editVacancy, [name]: value };
    if (name === "title_en") next.slug = makeSlug(value);
    setEditVacancy(next);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const required = [
      "title_ar",
      "title_en",
      "description_ar",
      "description_en",
      "formLink",
      "sheetLink",
      "slug",
    ];
    for (const f of required) {
      if (!newVacancy[f]) return alert(`الرجاء تعبئة الحقل: ${f}`);
    }
    try {
      const res = await fetch("http://localhost:5000/api/vacancies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVacancy),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإضافة");
      setAlertData({
        body: "تم إضافة الشاغر",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchVacancies();
      addCloseBtnRef.current?.click();
    } catch (error) {
      console.error(error);
      setAlertData({
        body: "حدث خطأ أثناء إضافة الشاغر",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const required = [
      "title_ar",
      "title_en",
      "description_ar",
      "description_en",
      "formLink",
      "sheetLink",
      "slug",
    ];
    for (const f of required) {
      if (!editVacancy?.[f]) return alert(`الرجاء تعبئة الحقل: ${f}`);
    }
    try {
      const res = await fetch(
        `http://localhost:5000/api/vacancies/${editVacancy._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editVacancy),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التعديل");
      setAlertData({
        body: "تم تعديل الشاغر",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchVacancies();
      editCloseBtnRef.current?.click();
    } catch (error) {
      console.error(error);
      setAlertData({
        body: "حدث خطأ أثناء تعديل الشاغر",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("هل أنت متأكد من حذف الشاغر؟")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/vacancies/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");
      setAlertData({
        body: "تم حذف الشاغر",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchVacancies();
    } catch (error) {
      console.error(error);
      setAlertData({
        body: "حدث خطأ أثناء حذف الشاغر",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  // ========= المتقدمون (Google Sheet) =========
  const fetchApplicantsForVacancy = async (vacancy) => {
    if (!vacancy) return;
    setApplicants({ headers: [], rows: [], tabTitle: "" });
    setApplicantsError(null);
    setApplicantsCount(null);
    setIsApplicantsLoading(true);
    try {
      const idOrSlug = vacancy._id || vacancy.slug;
      const res = await fetch(
        `http://localhost:5000/api/vacancies/${idOrSlug}/applicants`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل في جلب المتقدمين");
      const rows = Array.isArray(data.rows) ? data.rows : [];
      const nonEmptyRows = rows.filter(
        (r) =>
          Array.isArray(r) && r.some((cell) => String(cell ?? "").trim() !== "")
      );
      setApplicants({
        headers: data.headers || [],
        rows,
        tabTitle: data.tabTitle || "",
      });
      setApplicantsCount(nonEmptyRows.length);
    } catch (err) {
      setApplicantsError(err.message);
      setApplicantsCount(0);
    } finally {
      setIsApplicantsLoading(false);
    }
  };
  const openApplicants = (vacancy) => {
    setSelectedVacancyForApplicants(vacancy);
    fetchApplicantsForVacancy(vacancy);
  };
  const refreshApplicants = () => {
    if (selectedVacancyForApplicants)
      fetchApplicantsForVacancy(selectedVacancyForApplicants);
  };

  // ======== جداول بدون whitespace داخل <tr> ========
  const renderVacancyRows = () => {
    if (!Array.isArray(vacancies) || vacancies.length === 0) {
      return [
        <tr key="empty">
          <td colSpan={5} className="text-muted py-4">
            لا توجد شواغر حالياً
          </td>
        </tr>,
      ];
    }
    return vacancies.map((v) => {
      const cells = [
        <td key="title">
          <div className="fw-bold">{v.title_ar}</div>
          <div className="text-muted small">{v.title_en}</div>
        </td>,
        <td key="desc">
          <div>{v.description_ar}</div>
          <div className="text-muted small">{v.description_en}</div>
        </td>,
        <td key="btn">
          <button
            className="btn btn-sm btn-outline-dark"
            data-bs-toggle="modal"
            data-bs-target="#vacancyApplicantsModal"
            onClick={() => openApplicants(v)}
            title="عرض المتقدمين من Google Sheet"
          >
            عرض المتقدمين
          </button>
        </td>,
        <td key="link">
          <a
            href={v.formLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-primary"
          >
            <i className="bi bi-link-45deg" /> فتح
          </a>
        </td>,
        <td key="actions">
          <button
            className="btn btn-warning btn-sm me-2"
            data-bs-toggle="modal"
            data-bs-target="#editVacancyModal"
            onClick={() => setEditVacancy(v)}
          >
            <i className="bi bi-pencil-square" />
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={() => handleDelete(v._id)}
          >
            <i className="bi bi-trash" />
          </button>
        </td>,
      ];
      return <tr key={v._id}>{cells}</tr>;
    });
  };

  const headerCells = (applicants.headers || []).map((h, i) => (
    <th key={i} className="text-nowrap">
      {h}
    </th>
  ));
  const bodyRows = (applicants.rows || []).map((row, rIdx) => {
    const cells = (applicants.headers || []).map((_, cIdx) => (
      <td key={cIdx}>{row?.[cIdx] ?? null}</td>
    ));
    return <tr key={rIdx}>{cells}</tr>;
  });

  return (
    <ProtectedRoute allowed="vacancies">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold" style={{ color: "#1e293b" }}>
            <i className="bi bi-briefcase me-2" /> إدارة الشواغر
          </h2>
          {alertData && (
            <Alerts body={alertData.body} className={alertData.className} />
          )}
          <button
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#addVacancyModal"
          >
            <i className="bi bi-plus-circle me-1" /> إضافة شاغر
          </button>
        </div>

        <div className="table-responsive shadow p-3 mb-5 bg-body rounded">
          <table className="table table-hover text-center align-middle">
            <thead className="bg-light">
              <tr>
                <th>العنوان</th>
                <th>الشرح</th>
                <th>المتقدمين</th>
                <th>الرابط</th>
                <th>تحكم</th>
              </tr>
            </thead>
            <tbody>{renderVacancyRows()}</tbody>
          </table>
        </div>

        {/* مودال إضافة شاغر */}
        <div
          ref={addModalRef}
          className="modal fade"
          id="addVacancyModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form className="modal-content" onSubmit={handleAdd}>
              <div className="modal-header">
                <h5 className="modal-title">
                  إضافة شاغر{" "}
                  {newVacancy.slug ? (
                    <span className="text-muted fs-6">/ {newVacancy.slug}</span>
                  ) : null}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="إغلاق"
                />
                <button
                  ref={addCloseBtnRef}
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ display: "none" }}
                />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">العنوان (AR)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title_ar"
                      value={newVacancy.title_ar}
                      onChange={handleNewChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title (EN)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title_en"
                      value={newVacancy.title_en}
                      onChange={handleNewChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">الشرح (AR)</label>
                    <textarea
                      className="form-control"
                      name="description_ar"
                      rows={2}
                      value={newVacancy.description_ar}
                      onChange={handleNewChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Description (EN)</label>
                    <textarea
                      className="form-control"
                      name="description_en"
                      rows={2}
                      value={newVacancy.description_en}
                      onChange={handleNewChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">رابط Google Form</label>
                    <input
                      type="url"
                      className="form-control"
                      name="formLink"
                      value={newVacancy.formLink}
                      onChange={handleNewChange}
                      required
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">رابط Google Sheet</label>
                    <input
                      type="url"
                      className="form-control"
                      name="sheetLink"
                      value={newVacancy.sheetLink}
                      onChange={handleNewChange}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                      required
                    />
                    <div className="form-text">
                      شارك الشيت مع إيميل Service Account (Viewer).
                    </div>
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
                <button type="submit" className="btn btn-primary">
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* مودال تعديل شاغر */}
        <div
          ref={editModalRef}
          className="modal fade"
          id="editVacancyModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            {editVacancy && (
              <form className="modal-content" onSubmit={handleUpdate}>
                <div className="modal-header">
                  <h5 className="modal-title">
                    تعديل شاغر{" "}
                    {editVacancy.slug ? (
                      <span className="text-muted fs-6">
                        / {editVacancy.slug}
                      </span>
                    ) : null}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="إغلاق"
                  />
                  <button
                    ref={editCloseBtnRef}
                    type="button"
                    data-bs-dismiss="modal"
                    style={{ display: "none" }}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">العنوان (AR)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title_ar"
                        value={editVacancy.title_ar}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Title (EN)</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title_en"
                        value={editVacancy.title_en}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">الشرح (AR)</label>
                      <textarea
                        className="form-control"
                        name="description_ar"
                        rows={2}
                        value={editVacancy.description_ar}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Description (EN)</label>
                      <textarea
                        className="form-control"
                        name="description_en"
                        rows={2}
                        value={editVacancy.description_en}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">رابط Google Form</label>
                      <input
                        type="url"
                        className="form-control"
                        name="formLink"
                        value={editVacancy.formLink}
                        onChange={handleEditChange}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">رابط Google Sheet</label>
                      <input
                        type="url"
                        className="form-control"
                        name="sheetLink"
                        value={editVacancy.sheetLink || ""}
                        onChange={handleEditChange}
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
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
                  <button type="submit" className="btn btn-primary">
                    حفظ التعديلات
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* مودال المتقدمين */}
        <div
          className="modal fade"
          id="vacancyApplicantsModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span>
                    المتقدمون — {selectedVacancyForApplicants?.title_ar || ""}
                    {applicants.tabTitle
                      ? ` (تبويب: ${applicants.tabTitle})`
                      : ""}
                  </span>
                  <span className="badge bg-primary">
                    {isApplicantsLoading ? "..." : applicantsCount ?? 0}
                  </span>
                  <small className="text-muted">متقدم</small>
                </h5>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={refreshApplicants}
                    disabled={
                      isApplicantsLoading || !selectedVacancyForApplicants
                    }
                    title="تحديث"
                  >
                    <i className="bi bi-arrow-clockwise me-1" /> تحديث
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  />
                </div>
              </div>

              <div className="modal-body">
                {isApplicantsLoading ? (
                  <div className="d-flex justify-content-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : applicantsError ? (
                  <div
                    className="alert alert-danger d-flex align-items-center"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2" />
                    <div>{applicantsError}</div>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="alert alert-info py-2 px-3 mb-0">
                        <i className="bi bi-people-fill me-1" /> إجمالي
                        المتقدمين: <strong>{applicantsCount ?? 0}</strong>
                      </div>
                      <div className="text-muted small">
                        {selectedVacancyForApplicants?.slug
                          ? `/${selectedVacancyForApplicants.slug}`
                          : ""}
                      </div>
                    </div>

                    {headerCells.length === 0 ? (
                      <div className="text-muted">لا توجد بيانات لعرضها.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                          <thead className="table-light">
                            <tr>{headerCells}</tr>
                          </thead>
                          <tbody>
                            {bodyRows.length > 0 ? (
                              bodyRows
                            ) : (
                              <tr>
                                <td
                                  colSpan={headerCells.length}
                                  className="text-muted"
                                >
                                  لا توجد صفوف
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-bs-dismiss="modal"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* نهاية مودال المتقدمين */}
      </div>
    </ProtectedRoute>
  );
}
