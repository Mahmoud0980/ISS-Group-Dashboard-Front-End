"use client";

import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../_components/ProtectedRoute";
import Alerts from "../_components/Alerts";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [alertData, setAlertData] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "user",
    allowedSections: [],
  });

  const sections = [
    "courses",
    "news",
    "projects",
    "vacancies",
    "users",
    "statistics",
  ];

  // مراجع للمودالات وأزرار الإغلاق المخفية
  const addModalRef = useRef(null);
  const editModalRef = useRef(null);
  const addCloseBtnRef = useRef(null);
  const editCloseBtnRef = useRef(null);

  // تأكيد إزالة الـ backdrop وتصفير الحالة بعد الإغلاق الحقيقي
  useEffect(() => {
    const addEl = addModalRef.current;
    const editEl = editModalRef.current;

    function onAddHidden() {
      // فورم الإضافة: صفّي الحقول بعد الإغلاق
      setNewUser({
        username: "",
        email: "",
        password: "",
        role: "user",
        allowedSections: [],
      });
      // تنظيف احتياطي
      cleanupBackdrop();
    }
    function onEditHidden() {
      // التعديل: صفّي المختار بعد الإغلاق
      setSelectedUser(null);
      cleanupBackdrop();
    }

    addEl?.addEventListener("hidden.bs.modal", onAddHidden);
    editEl?.addEventListener("hidden.bs.modal", onEditHidden);

    return () => {
      addEl?.removeEventListener("hidden.bs.modal", onAddHidden);
      editEl?.removeEventListener("hidden.bs.modal", onEditHidden);
    };
  }, []);

  function cleanupBackdrop() {
    // لو ظلّت الخلفية لأي سبب، شيلها
    const backs = document.querySelectorAll(".modal-backdrop");
    backs.forEach((b) => b.remove());
    document.body.classList.remove("modal-open");
    document.body.style.removeProperty("padding-right");
  }
  const getAuthHeaders = () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // جلب المستخدمين
  async function fetchUsers() {
    try {
      const res = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/users",
        {
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل في جلب المستخدمين");
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setAlertData({
        body: err.message || "فشل في جلب المستخدمين",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      console.error(err);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  // إضافة مستخدم
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/users",
        {
          method: "POST",
          headers: getAuthHeaders(), // ⬅️ مهم
          body: JSON.stringify(newUser),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الإضافة");
      setAlertData({
        body: "تم إضافة المستخدم",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchUsers();
      addCloseBtnRef.current?.click();
    } catch (err) {
      setAlertData({
        body: err.message,
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  // حذف مستخدم
  const handleDelete = async (id, isProtected) => {
    if (isProtected) {
      setAlertData({
        body: "لا يمكن حذف هذا المستخدم",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      return; // ⬅️ مهم حتى ما يكمل التنفيذ
    }
    if (!confirm("هل أنت متأكد من حذف هذا المستخدم؟")) return;

    try {
      const res = await fetch(
        `https://iss-group-dashboard-2.onrender.com/api/users/${id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل الحذف");

      setAlertData({
        body: "تم حذف المستخدم",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchUsers();
    } catch (err) {
      setAlertData({
        body: err.message,
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  // تحديث مستخدم
  const handleUpdateUser = async () => {
    try {
      const body = {
        username: selectedUser.username,
        email: selectedUser.email,
        allowedSections: selectedUser.allowedSections,
      };
      if (selectedUser.newPassword) body.password = selectedUser.newPassword;

      const res = await fetch(
        `https://iss-group-dashboard-2.onrender.com/api/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل التحديث");

      setAlertData({
        body: "تم تحديث بيانات المستخدم",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchUsers();
      editCloseBtnRef.current?.click();
    } catch (err) {
      console.error(err);
      setAlertData({
        body: err.message || "خطأ في الاتصال بالخادم",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  // حقول إنشاء مستخدم
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewUser((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (e) => {
    const { value, checked } = e.target;
    setNewUser((prev) => ({
      ...prev,
      allowedSections: checked
        ? [...prev.allowedSections, value]
        : prev.allowedSections.filter((sec) => sec !== value),
    }));
  };

  return (
    <ProtectedRoute allowed="users">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className="fw-bold" style={{ color: "#1e293b" }}>
            <i className="bi bi-people me-2"></i> إدارة المستخدمين
          </h2>
          {alertData && (
            <Alerts body={alertData.body} className={alertData.className} />
          )}
          <button
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#addUserModal"
          >
            <i className="bi bi-plus-circle me-1"></i> إضافة مستخدم
          </button>
        </div>

        <div className="table-responsive shadow p-3 mb-5 bg-body rounded">
          <table className="table table-hover text-center align-middle">
            <thead className="bg-light text-center">
              <tr>
                <th>الاسم</th>
                <th>البريد</th>
                <th>الدور</th>
                <th>الأقسام المسموحة</th>
                <th>تحكم</th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`badge ${
                          user.role === "admin" ? "bg-primary" : "bg-secondary"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <small>{user.allowedSections?.join(", ")}</small>
                    </td>
                    <td className="d-flex justify-content-center gap-2">
                      {!user.isProtected && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(user._id, user.isProtected)
                          }
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-warning"
                        data-bs-toggle="modal"
                        data-bs-target="#editUserModal"
                        onClick={() => setSelectedUser(user)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-muted py-4">
                    لا يوجد مستخدمون حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* مودال: إضافة مستخدم */}
        <div
          ref={addModalRef}
          className="modal fade"
          id="addUserModal"
          tabIndex="-1"
          aria-labelledby="addUserModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg">
            <form className="modal-content" onSubmit={handleAddUser}>
              <div className="modal-header">
                <h5 className="modal-title" id="addUserModalLabel">
                  إضافة مستخدم جديد
                </h5>
                {/* زر إغلاق ظاهر للمستخدم */}
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
                {/* زر إغلاق مخفي سنضغطه برمجياً */}
                <button
                  ref={addCloseBtnRef}
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ display: "none" }}
                />
              </div>

              <div className="modal-body row g-3">
                <div className="col-md-6">
                  <label className="form-label">اسم المستخدم</label>
                  <input
                    type="text"
                    name="username"
                    className="form-control"
                    value={newUser.username}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    value={newUser.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">كلمة المرور</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    value={newUser.password}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">الدور</label>
                  <select
                    name="role"
                    className="form-select"
                    value={newUser.role}
                    onChange={handleChange}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="col-md-12">
                  <label className="form-label">الأقسام المسموح بها</label>
                  <div className="d-flex flex-wrap gap-3">
                    {sections.map((sec) => (
                      <div className="form-check" key={sec}>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          value={sec}
                          id={`add-${sec}`}
                          onChange={handleSectionChange}
                          checked={newUser.allowedSections.includes(sec)}
                        />
                        <label
                          className="form-check-label"
                          htmlFor={`add-${sec}`}
                        >
                          {sec}
                        </label>
                      </div>
                    ))}
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
                  حفظ المستخدم
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* مودال: تعديل مستخدم */}
        <div
          ref={editModalRef}
          className="modal fade"
          id="editUserModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg">
            <form
              className="modal-content"
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateUser();
              }}
            >
              <div className="modal-header">
                <h5 className="modal-title">تعديل معلومات المستخدم</h5>
                {/* زر إغلاق ظاهر */}
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                ></button>
                {/* زر إغلاق مخفي سنضغطه برمجياً */}
                <button
                  ref={editCloseBtnRef}
                  type="button"
                  data-bs-dismiss="modal"
                  style={{ display: "none" }}
                />
              </div>

              <div className="modal-body">
                {selectedUser && (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">اسم المستخدم</label>
                      <input
                        type="text"
                        className="form-control"
                        value={selectedUser.username}
                        onChange={(e) =>
                          setSelectedUser((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">البريد الإلكتروني</label>
                      <input
                        type="email"
                        className="form-control"
                        value={selectedUser.email}
                        onChange={(e) =>
                          setSelectedUser((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">
                        كلمة المرور الجديدة (اختياري)
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={selectedUser.newPassword || ""}
                        onChange={(e) =>
                          setSelectedUser((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                      />
                      <small className="text-muted">
                        اترك الحقل فارغاً إن لم ترد تغييره
                      </small>
                    </div>

                    <div className="col-12">
                      <label className="form-label">الأقسام المسموحة</label>
                      <div className="d-flex flex-wrap gap-3">
                        {sections.map((section) => {
                          const checked =
                            selectedUser.allowedSections?.includes(section);
                          return (
                            <div className="form-check" key={section}>
                              <input
                                className="form-check-input"
                                type="checkbox"
                                id={`edt-${section}`}
                                checked={!!checked}
                                onChange={(e) => {
                                  const next = new Set(
                                    selectedUser.allowedSections || []
                                  );
                                  if (e.target.checked) next.add(section);
                                  else next.delete(section);
                                  setSelectedUser((prev) => ({
                                    ...prev,
                                    allowedSections: Array.from(next),
                                  }));
                                }}
                              />
                              <label
                                className="form-check-label"
                                htmlFor={`edt-${section}`}
                              >
                                {section}
                              </label>
                            </div>
                          );
                        })}
                      </div>
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
                <button type="submit" className="btn btn-primary">
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
