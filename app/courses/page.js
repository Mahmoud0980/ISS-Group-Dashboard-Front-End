"use client";
import { useEffect, useRef, useState } from "react";
import ProtectedRoute from "../_components/ProtectedRoute";
import Alerts from "../_components/Alerts";
import "./courses.css";

/* =================== ثوابت =================== */
const WEEK_DAYS = [
  { en: "Saturday", ar: "السبت" },
  { en: "Sunday", ar: "الأحد" },
  { en: "Monday", ar: "الاثنين" },
  { en: "Tuesday", ar: "الثلاثاء" },
  { en: "Wednesday", ar: "الأربعاء" },
  { en: "Thursday", ar: "الخميس" },
  { en: "Friday", ar: "الجمعة" },
];

/* =================== أدوات الوقت المرنة =================== */
// تحويل أرقام عربية -> لاتينية
const arabicDigitsMap = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
};
const normalizeDigits = (s) =>
  s.replace(/[٠-٩]/g, (d) => arabicDigitsMap[d] || d);

// تنظيف النص (إزالة محارف غريبة واتجاهات)
const clean = (s) =>
  normalizeDigits(String(s || ""))
    .replace(/\u200E|\u200F|\u202A|\u202B|\u202C|\u202D|\u202E/g, "")
    .replace(/\s+/g, " ")
    .trim();

const pad = (n) => String(n).padStart(2, "0");

// يحوّل نص وقت (24h أو 12h AM/PM أو ص/م) إلى "HH:MM" بنظام 24 ساعة
const to24 = (raw) => {
  const str = clean(raw).toUpperCase();

  // 1) 24 ساعة (اسمح بساعة رقم واحد أيضًا)
  let m = str.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (m) {
    const hh = pad(m[1]);
    const mm = pad(m[2]);
    return `${hh}:${mm}`;
  }

  // 2) 12 ساعة AM/PM أو عربية ص/م
  // أمثلة: "2:30 PM", "12:05 am", "05:30 م", "7:00 ص"
  const str2 = str
    .replace(/ص|AM/gi, "AM")
    .replace(/م|PM/gi, "PM")
    .replace(/\s+/g, " ")
    .trim();

  m = str2.match(/^([0]?\d|1[0-2]):([0-5]\d)\s?(AM|PM)$/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const mm = pad(m[2]);
    const ap = m[3].toUpperCase();
    if (ap === "AM") {
      if (h === 12) h = 0;
    } else {
      if (h !== 12) h += 12;
    }
    return `${pad(h)}:${mm}`;
  }

  // غير معروف
  return null;
};

// إضافة دقائق إلى "HH:MM" مع معرفة إن تعدّى اليوم
const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const fromMinutes = (mins) => {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
};
const addMinutes = (t, minutes) => {
  const total = toMinutes(t) + minutes;
  const dayDelta = Math.floor(total / 1440);
  return { time: fromMinutes((total + 1440) % 1440), dayDelta };
};

// يفصل مدى بنّان على أي نوع شرطة
const splitRange = (val) => clean(val).split(/\s*[-–—]\s*/);

// حول قيمة واحدة/مدى إلى مدى ساعتين مضبوط
const parseTo2hRange = (val) => {
  const v = clean(val);
  if (!v) return { ok: false, msg: "الوقت فارغ" };

  const parts = splitRange(v);
  if (parts.length === 2) {
    const a24 = to24(parts[0]);
    const b24 = to24(parts[1]);
    if (!a24 || !b24)
      return { ok: false, msg: "اكتب الوقت بصيغة HH:MM أو HH:MM AM/PM" };
    const diff = toMinutes(b24) - toMinutes(a24);
    if (diff !== 120) return { ok: false, msg: "المدة يجب أن تكون ساعتين" };
    return { ok: true, range: `${a24} - ${b24}` };
  } else {
    const a24 = to24(v);
    if (!a24) return { ok: false, msg: "اكتب الوقت بصيغة HH:MM مثل 17:30" };
    const { time: end, dayDelta } = addMinutes(a24, 120);
    if (dayDelta !== 0)
      return { ok: false, msg: "لا يمكن أن يمتد الوقت لليوم التالي" };
    return { ok: true, range: `${a24} - ${end}` };
  }
};

// طبّع الجدول: يقبل الصيغ القديمة ويحوّلها لمدى 24h
const normalizeSchedule = (schedule) =>
  (schedule || []).map((it) => {
    const ar = parseTo2hRange(it.time_ar || "");
    const en = parseTo2hRange(it.time_en || it.time_ar || "");
    return {
      ...it,
      time_ar: ar.ok ? ar.range : it.time_ar,
      time_en: en.ok ? en.range : it.time_en,
      _errors: { ar, en },
    };
  });

const validateAndNormalizeSchedule = (schedule) => {
  if (!Array.isArray(schedule) || schedule.length === 0) {
    return { error: "اختر على الأقل يوم تدريب وحدد وقته.", schedule: [] };
  }
  const normalized = normalizeSchedule(schedule);
  for (const item of normalized) {
    const day = `${item.day_ar || item.day_en}`;
    if (!item._errors.ar.ok)
      return {
        error: `وقت اليوم ${day} غير صالح: ${item._errors.ar.msg}`,
        schedule: normalized,
      };
    if (!item._errors.en.ok)
      return {
        error: `وقت (EN) لليوم ${day} غير صالح: ${item._errors.en.msg}`,
        schedule: normalized,
      };
  }
  const cleaned = normalized.map(({ _errors, ...rest }) => rest);
  return { schedule: cleaned, error: null };
};

// استخرج وقت البداية (24h) من قيمة قديمة/جديدة لعرضه في input
const start24FromValue = (val) => {
  const v = clean(val);
  if (!v) return "";
  const parts = splitRange(v);
  const first = parts[0] || "";
  const t = to24(first);
  return t || "";
};

/* =================== مكوّن اختيار الجدول الزمني =================== */
function SchedulePicker({ value, onChange }) {
  const selected = new Map(value.map((v) => [v.day_en, v]));
  const [separateTimes, setSeparateTimes] = useState(false); // false = وقت موحّد
  const [unifiedStart, setUnifiedStart] = useState("");
  const [errors, setErrors] = useState({}); // { [day_en]: "msg" }

  const makeRangeFromStart = (start) => {
    const r = parseTo2hRange(start);
    return r.ok ? r.range : "";
  };

  const applyUnifiedToAll = (start) => {
    const range = makeRangeFromStart(start);
    if (!range) return;
    const next = value.map((v) => ({ ...v, time_ar: range, time_en: range }));
    onChange(next);
  };

  const toggleDay = (day) => {
    const exists = selected.has(day.en);
    if (exists) {
      onChange(value.filter((v) => v.day_en !== day.en));
    } else {
      const range =
        !separateTimes && unifiedStart ? makeRangeFromStart(unifiedStart) : "";
      onChange([
        ...value,
        {
          day_en: day.en,
          day_ar: day.ar,
          time_en: range || "",
          time_ar: range || "",
        },
      ]);
    }
  };

  const changeStartForDay = (day_en, start) => {
    const parsed = parseTo2hRange(start);
    setErrors((prev) => ({
      ...prev,
      [day_en]: parsed.ok ? "" : parsed.msg || "وقت غير صالح",
    }));
    onChange(
      value.map((v) =>
        v.day_en === day_en
          ? {
              ...v,
              time_ar: parsed.ok ? parsed.range : "",
              time_en: parsed.ok ? parsed.range : "",
            }
          : v
      )
    );
  };

  const changeUnifiedStart = (start) => {
    setUnifiedStart(start);
    applyUnifiedToAll(start);
  };

  return (
    <div className="border rounded p-3">
      <label className="form-label mb-2 d-block">أيام التدريب وأوقاتها</label>

      <div className="d-flex flex-wrap gap-3 mb-3">
        {WEEK_DAYS.map((day) => (
          <div className="form-check" key={day.en}>
            <input
              className="form-check-input"
              type="checkbox"
              id={`day-${day.en}`}
              checked={selected.has(day.en)}
              onChange={() => toggleDay(day)}
            />
            <label className="form-check-label" htmlFor={`day-${day.en}`}>
              {day.ar} / {day.en}
            </label>
          </div>
        ))}
      </div>

      {/* تشغيل/إيقاف أوقات مختلفة لكل يوم */}
      <div className="form-check form-switch mb-3">
        <input
          className="form-check-input"
          type="checkbox"
          id="separateTimesSwitch"
          checked={separateTimes}
          onChange={(e) => setSeparateTimes(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="separateTimesSwitch">
          أوقات مختلفة لكل يوم؟
        </label>
      </div>

      {/* وقت موحّد لكل الأيام */}
      {!separateTimes && (
        <div className="row g-2 align-items-center mb-3">
          <div className="col-auto">
            <span className="badge bg-dark">وقت موحّد</span>
          </div>
          <div className="col-sm-4">
            <label className="form-label">وقت البداية</label>
            <input
              type="time"
              className="form-control"
              value={unifiedStart}
              onChange={(e) => changeUnifiedStart(e.target.value)}
            />
          </div>
          <div className="col-sm-4">
            <label className="form-label">وقت النهاية (+2 ساعة)</label>
            <input
              type="time"
              className="form-control"
              value={
                unifiedStart
                  ? parseTo2hRange(unifiedStart).ok
                    ? parseTo2hRange(unifiedStart).range.split(" - ")[1]
                    : ""
                  : ""
              }
              readOnly
              disabled
              title="يُحسب تلقائيًا بعد ساعتين"
            />
          </div>
          {unifiedStart && !parseTo2hRange(unifiedStart).ok && (
            <div className="col-12 text-danger small mt-1">
              {parseTo2hRange(unifiedStart).msg || "وقت غير صالح"}
            </div>
          )}
        </div>
      )}

      {/* أوقات مختلفة لكل يوم */}
      {separateTimes && value.length > 0 && (
        <div className="row g-3">
          {value.map((item) => {
            const start = start24FromValue(item.time_ar);
            const end = start
              ? parseTo2hRange(start).ok
                ? parseTo2hRange(start).range.split(" - ")[1]
                : ""
              : "";
            const error = errors[item.day_en];
            return (
              <div key={item.day_en} className="col-12">
                <div className="row g-2 align-items-center">
                  <div className="col-md-3">
                    <span className="badge bg-secondary w-100">
                      {item.day_ar} / {item.day_en}
                    </span>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">وقت البداية</label>
                    <input
                      type="time"
                      className={`form-control ${error ? "is-invalid" : ""}`}
                      value={start}
                      onChange={(e) =>
                        changeStartForDay(item.day_en, e.target.value)
                      }
                    />
                    {error && <div className="invalid-feedback">{error}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">وقت النهاية (+2 ساعة)</label>
                    <input
                      type="time"
                      className="form-control"
                      value={end}
                      readOnly
                      disabled
                      title="يُحسب تلقائيًا بعد ساعتين"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* =================== الصفحة الرئيسية =================== */
export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [editCourse, setEditCourse] = useState(null);
  const [alertData, setAlertData] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null);
  const [applicantsCount, setApplicantsCount] = useState(null);
  const [selectedCourseForApplicants, setSelectedCourseForApplicants] =
    useState(null);
  const [applicants, setApplicants] = useState({
    headers: [],
    rows: [],
    tabTitle: "",
  });
  const [isApplicantsLoading, setIsApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState(null);

  const [newCourse, setNewCourse] = useState({
    title_ar: "",
    title_en: "",
    level_ar: "",
    level_en: "",
    trainingSchedule: [],
    trainingHours_ar: "",
    trainingHours_en: "",
    instructor_ar: "",
    instructor_en: "",
    formLink: "",
    sheetLink: "",
    slug: "",
    image: "",
    description_ar: "",
    description_en: "",
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
      setNewCourse({
        title_ar: "",
        title_en: "",
        level_ar: "",
        level_en: "",
        trainingSchedule: [],
        trainingHours_ar: "",
        trainingHours_en: "",
        instructor_ar: "",
        instructor_en: "",
        formLink: "",
        sheetLink: "",
        slug: "",
        image: "",
        description_ar: "",
        description_en: "",
      });
      cleanupBackdrop();
    };

    const onEditHidden = () => {
      setEditCourse(null);
      setEditImageFile(null);
      cleanupBackdrop();
    };

    addEl?.addEventListener("hidden.bs.modal", onAddHidden);
    editEl?.addEventListener("hidden.bs.modal", onEditHidden);
    return () => {
      addEl?.removeEventListener("hidden.bs.modal", onAddHidden);
      editEl?.removeEventListener("hidden.bs.modal", onEditHidden);
    };
  }, []);

  /* =================== جلب الكورسات =================== */
  const fetchCourses = async () => {
    try {
      const res = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/courses?lang=ar"
      );
      const data = await res.json();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("فشل في جلب البيانات", err);
      setAlertData({
        body: "فشل في جلب البيانات",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };
  useEffect(() => {
    fetchCourses();
  }, []);

  /* =================== تغييرات الحقول + slug =================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    let updated = { ...newCourse, [name]: value };
    if (name === "title_en") {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      updated.slug = slug;
    }
    setNewCourse(updated);
  };

  /* =================== تعديل كورس =================== */
  const handleUpdate = async (e, id) => {
    e.preventDefault();

    const { schedule: norm, error } = validateAndNormalizeSchedule(
      editCourse?.trainingSchedule || []
    );
    if (error) {
      setAlertData({
        body: error,
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      return;
    }

    try {
      let response;

      if (editImageFile) {
        const form = new FormData();
        Object.entries(editCourse).forEach(([k, v]) => {
          if (k === "trainingSchedule") {
            form.append("trainingSchedule", JSON.stringify(norm));
          } else if (k !== "image") {
            form.append(k, v ?? "");
          }
        });
        form.append("image", editImageFile);

        response = await fetch(
          `https://iss-group-dashboard-2.onrender.com/api/courses/${id}`,
          {
            method: "PUT",
            body: form,
          }
        );
      } else {
        const payload = { ...editCourse, trainingSchedule: norm };
        response = await fetch(
          `https://iss-group-dashboard-2.onrender.com/api/courses/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
      }

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "فشل في التعديل");

      setAlertData({
        body: "تم تعديل الكورس",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      setEditImageFile(null);
      editCloseBtnRef.current?.click();
      fetchCourses();
    } catch (err) {
      console.error("استثناء في التعديل:", err);
      setAlertData({
        body: "حدث خطأ أثناء التعديل: " + err.message,
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  /* =================== إضافة كورس =================== */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const requiredFields = [
      "title_ar",
      "title_en",
      "description_ar",
      "description_en",
      "level_ar",
      "level_en",
      "instructor_ar",
      "instructor_en",
      "trainingHours_ar",
      "trainingHours_en",
      "formLink",
      "sheetLink",
      "slug",
      "image",
    ];
    for (let field of requiredFields) {
      if (!newCourse[field]) {
        setAlertData({
          body: `الحقل ${field} فارغ`,
          className: "alert alert-danger position-fixed top-0-0",
        });
        setTimeout(() => setAlertData(null), 2000);
        return;
      }
    }

    if (!newCourse.trainingSchedule.length) {
      setAlertData({
        body: "اختر على الاقل يوم تدريب وحدد وقته",
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      return;
    }

    const { schedule: norm, error } = validateAndNormalizeSchedule(
      newCourse.trainingSchedule
    );
    if (error) {
      setAlertData({
        body: error,
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      return;
    }

    try {
      const form = new FormData();
      for (let key in newCourse) {
        if (key === "trainingSchedule") {
          form.append("trainingSchedule", JSON.stringify(norm));
        } else {
          form.append(key, newCourse[key]);
        }
      }

      const response = await fetch(
        "https://iss-group-dashboard-2.onrender.com/api/courses",
        {
          method: "POST",
          body: form,
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "فشل في الإضافة");

      setAlertData({
        body: "تم إضافة الكورس بنجاح",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchCourses();
      addCloseBtnRef.current?.click();
    } catch (err) {
      console.error(err);
      setAlertData({
        body: "حدث خطأ أثناء الإضافة: " + (err.message || ""),
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  /* =================== حذف كورس =================== */
  const handleDelete = async (id) => {
    if (!window.confirm("هل أنت متأكد أنك تريد حذف هذا الكورس؟")) return;
    try {
      const response = await fetch(
        `https://iss-group-dashboard-2.onrender.com/api/courses/${id}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "فشل في الحذف");

      setAlertData({
        body: "تم حذف الكورس بنجاح",
        className: "alert alert-success position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
      fetchCourses();
    } catch (err) {
      console.error(err);
      setAlertData({
        body: "حدث خطأ أثناء الحذف: " + (err.message || ""),
        className: "alert alert-danger position-fixed top-0-0",
      });
      setTimeout(() => setAlertData(null), 2000);
    }
  };

  /* =================== المتقدمون للشيت =================== */
  const fetchApplicantsFor = async (course) => {
    if (!course) return;
    setApplicants({ headers: [], rows: [], tabTitle: "" });
    setApplicantsError(null);
    setApplicantsCount(null);
    setIsApplicantsLoading(true);

    try {
      const idOrSlug = course._id || course.slug;
      const res = await fetch(
        `https://iss-group-dashboard-2.onrender.com/api/courses/${idOrSlug}/applicants`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل في جلب المتقدمين");

      const rows = Array.isArray(data.rows) ? data.rows : [];
      const nonEmptyRows = rows.filter(
        (row) =>
          Array.isArray(row) &&
          row.some((cell) => String(cell ?? "").trim() !== "")
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
  const openApplicants = async (course) => {
    setSelectedCourseForApplicants(course);
    await fetchApplicantsFor(course);
  };
  const refreshApplicants = async () => {
    if (selectedCourseForApplicants)
      await fetchApplicantsFor(selectedCourseForApplicants);
  };

  /* =================== JSX =================== */
  return (
    <ProtectedRoute allowed="courses">
      <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <h2 className="fw-bold" style={{ color: "#1e293b" }}>
            <i className="bi bi-journal-code me-2"></i>إدارة الكورسات
          </h2>
          {alertData && (
            <Alerts body={alertData.body} className={alertData.className} />
          )}
          <button
            className="btn btn-success"
            data-bs-toggle="modal"
            data-bs-target="#addCourseModal"
          >
            <i className="bi bi-plus-circle me-1"></i> إضافة كورس
          </button>
        </div>

        {/* جدول عرض الكورسات */}
        <div
          className="table-responsive shadow p-3 mb-5 bg-body rounded"
          style={{ backgroundColor: "#f8fefe" }}
        >
          <table
            className="table table-hover align-middle mb-0 courses-table"
            style={{ backgroundColor: "#f8fefe" }}
          >
            <thead className="bg-light text-center">
              <tr>
                <th>العنوان</th>
                <th>المستوى</th>
                <th>المتقدمين</th>
                <th>الأيام</th>
                <th>الأوقات</th>
                <th>الرابط</th>
                <th>تحكم</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course._id || course.slug}>
                    <td>
                      <div className="fw-bold">{course.title_ar}</div>
                      <div className="text-muted small">{course.title_en}</div>
                    </td>
                    <td>
                      <span className="badge bg-info">{course.level_ar}</span>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-dark"
                        data-bs-toggle="modal"
                        data-bs-target="#applicantsModal"
                        onClick={() => openApplicants(course)}
                        title="عرض المتقدمين من Google Sheet"
                      >
                        عرض المتقدمين
                      </button>
                    </td>
                    <td>
                      {course.trainingSchedule
                        ?.map((s) => s.day_ar)
                        .join(" - ")}
                    </td>
                    <td>
                      {course.trainingSchedule
                        ?.map((s) => s.time_ar)
                        .join(" | ")}
                    </td>
                    <td>
                      <a
                        href={course.formLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        <i className="bi bi-link-45deg"></i> فتح
                      </a>
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-warning me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#editCourseModal"
                        onClick={() => setEditCourse(course)}
                      >
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(course._id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">
                    <i className="bi bi-info-circle"></i> لا توجد دورات حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* مودال إضافة كورس */}
        <div
          ref={addModalRef}
          className="modal fade"
          id="addCourseModal"
          tabIndex="-1"
          aria-labelledby="addCourseModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title" id="addCourseModalLabel">
                  إضافة كورس جديد{" "}
                  {newCourse.slug && (
                    <span className="text-muted fs-6">/ {newCourse.slug}</span>
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
                      value={newCourse.title_ar}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title (EN)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="title_en"
                      value={newCourse.title_en}
                      onChange={handleChange}
                    />
                  </div>

                  {/* الوصف */}
                  <div className="col-md-6">
                    <label className="form-label">الوصف (AR)</label>
                    <textarea
                      className="form-control"
                      name="description_ar"
                      rows="2"
                      value={newCourse.description_ar}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Description (EN)</label>
                    <textarea
                      className="form-control"
                      name="description_en"
                      rows="2"
                      value={newCourse.description_en}
                      onChange={handleChange}
                    />
                  </div>

                  {/* المستوى */}
                  <div className="col-md-6">
                    <label className="form-label">المستوى (AR)</label>
                    <select
                      className="form-select"
                      name="level_ar"
                      value={newCourse.level_ar}
                      onChange={handleChange}
                    >
                      <option value="">اختر المستوى</option>
                      <option value="أساسي">أساسي</option>
                      <option value="مبتدئ">مبتدئ</option>
                      <option value="متقدم">متقدم</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Level (EN)</label>
                    <select
                      className="form-select"
                      name="level_en"
                      value={newCourse.level_en}
                      onChange={handleChange}
                    >
                      <option value="">Select level</option>
                      <option value="Basic">Basic</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>

                  {/* الجدول الزمني */}
                  <div className="col-12">
                    <SchedulePicker
                      value={newCourse.trainingSchedule}
                      onChange={(next) =>
                        setNewCourse({ ...newCourse, trainingSchedule: next })
                      }
                    />
                  </div>

                  {/* ساعات التدريب */}
                  <div className="col-md-6">
                    <label className="form-label">ساعات التدريب (AR)</label>
                    <select
                      className="form-select"
                      name="trainingHours_ar"
                      value={newCourse.trainingHours_ar}
                      onChange={handleChange}
                    >
                      <option value="">اختر</option>
                      <option value="20 ساعة تدريبية">20 ساعة تدريبية</option>
                      <option value="30 ساعة تدريبية">30 ساعة تدريبية</option>
                      <option value="40 ساعة تدريبية">40 ساعة تدريبية</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Training Hours (EN)</label>
                    <select
                      className="form-select"
                      name="trainingHours_en"
                      value={newCourse.trainingHours_en}
                      onChange={handleChange}
                    >
                      <option value="">Select</option>
                      <option value="20 training hours">
                        20 training hours
                      </option>
                      <option value="30 training hours">
                        30 training hours
                      </option>
                      <option value="40 training hours">
                        40 training hours
                      </option>
                    </select>
                  </div>

                  {/* المدرب */}
                  <div className="col-md-6">
                    <label className="form-label">اسم المدرب (AR)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="instructor_ar"
                      value={newCourse.instructor_ar}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Instructor (EN)</label>
                    <input
                      type="text"
                      className="form-control"
                      name="instructor_en"
                      value={newCourse.instructor_en}
                      onChange={handleChange}
                    />
                  </div>

                  {/* الروابط */}
                  <div className="col-md-12">
                    <label className="form-label">رابط التسجيل</label>
                    <input
                      type="text"
                      className="form-control"
                      name="formLink"
                      value={newCourse.formLink}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">رابط Google Sheet</label>
                    <input
                      type="text"
                      className="form-control"
                      name="sheetLink"
                      value={newCourse.sheetLink}
                      onChange={handleChange}
                      placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                    />
                    <div className="form-text">
                      شارك الشيت مع إيميل الـ Service Account (قراءة فقط)
                    </div>
                  </div>

                  {/* الصورة */}
                  <div className="col-md-6">
                    <label className="form-label">تحميل صورة</label>
                    <input
                      type="file"
                      className="form-control"
                      name="image"
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, image: e.target.files[0] })
                      }
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
                  حفظ الكورس
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* مودال تعديل الكورس */}
        <div
          ref={editModalRef}
          className="modal fade"
          id="editCourseModal"
          tabIndex="-1"
          aria-labelledby="editCourseModalLabel"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <form
              className="modal-content"
              onSubmit={(e) => handleUpdate(e, editCourse?._id)}
            >
              <div className="modal-header">
                <h5 className="modal-title" id="editCourseModalLabel">
                  تعديل الكورس{" "}
                  {editCourse?.slug && (
                    <span className="text-muted fs-6">/ {editCourse.slug}</span>
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
                {editCourse && (
                  <div className="container-fluid">
                    {/* العناوين */}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">العنوان (AR)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title_ar"
                          value={editCourse.title_ar || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              title_ar: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Title (EN)</label>
                        <input
                          type="text"
                          className="form-control"
                          name="title_en"
                          value={editCourse.title_en || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            const generatedSlug = val
                              .toLowerCase()
                              .trim()
                              .replace(/[^\w\s-]/g, "")
                              .replace(/\s+/g, "-");
                            setEditCourse({
                              ...editCourse,
                              title_en: val,
                              slug: generatedSlug,
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* الوصف */}
                    <div className="row g-3 mt-3">
                      <div className="col-md-6">
                        <label className="form-label">الوصف (AR)</label>
                        <textarea
                          className="form-control"
                          name="description_ar"
                          rows="2"
                          value={editCourse.description_ar || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              description_ar: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Description (EN)</label>
                        <textarea
                          className="form-control"
                          name="description_en"
                          rows="2"
                          value={editCourse.description_en || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              description_en: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* المستوى */}
                    <div className="row g-3 mt-3">
                      <div className="col-md-6">
                        <label className="form-label">المستوى (AR)</label>
                        <select
                          className="form-select"
                          name="level_ar"
                          value={editCourse.level_ar || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              level_ar: e.target.value,
                            })
                          }
                        >
                          <option value="أساسي">أساسي</option>
                          <option value="مبتدئ">مبتدئ</option>
                          <option value="متقدم">متقدم</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Level (EN)</label>
                        <select
                          className="form-select"
                          name="level_en"
                          value={editCourse.level_en || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              level_en: e.target.value,
                            })
                          }
                        >
                          <option value="Basic">Basic</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>

                    {/* الجدول الزمني */}
                    <div className="row g-3 mt-3">
                      <div className="col-12">
                        <SchedulePicker
                          value={editCourse.trainingSchedule || []}
                          onChange={(next) =>
                            setEditCourse({
                              ...editCourse,
                              trainingSchedule: next,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* ساعات التدريب */}
                    <div className="row g-3 mt-3">
                      <div className="col-md-6">
                        <label className="form-label">ساعات التدريب (AR)</label>
                        <select
                          className="form-select"
                          name="trainingHours_ar"
                          value={editCourse.trainingHours_ar || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              trainingHours_ar: e.target.value,
                            })
                          }
                        >
                          <option value="20 ساعة تدريبية">
                            20 ساعة تدريبية
                          </option>
                          <option value="30 ساعة تدريبية">
                            30 ساعة تدريبية
                          </option>
                          <option value="40 ساعة تدريبية">
                            40 ساعة تدريبية
                          </option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Training Hours (EN)
                        </label>
                        <select
                          className="form-select"
                          name="trainingHours_en"
                          value={editCourse.trainingHours_en || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              trainingHours_en: e.target.value,
                            })
                          }
                        >
                          <option value="20 training hours">
                            20 training hours
                          </option>
                          <option value="30 training hours">
                            30 training hours
                          </option>
                          <option value="40 training hours">
                            40 training hours
                          </option>
                        </select>
                      </div>
                    </div>

                    {/* الروابط + الصورة */}
                    <div className="row g-3 mt-3">
                      <div className="col-md-12">
                        <label className="form-label">رابط التسجيل</label>
                        <input
                          type="text"
                          className="form-control"
                          name="formLink"
                          value={editCourse.formLink || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              formLink: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="row g-3 mt-3">
                      <div className="col-md-12">
                        <label className="form-label">رابط Google Sheet</label>
                        <input
                          type="text"
                          className="form-control"
                          name="sheetLink"
                          value={editCourse.sheetLink || ""}
                          onChange={(e) =>
                            setEditCourse({
                              ...editCourse,
                              sheetLink: e.target.value,
                            })
                          }
                          placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                        />
                      </div>
                    </div>

                    <div className="col-md-6 mt-3">
                      <label className="form-label">تغيير الصورة</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) =>
                          setEditImageFile(e.target.files?.[0] || null)
                        }
                      />
                      {typeof editCourse.image === "string" &&
                        editCourse.image && (
                          <div className="form-text mt-1">
                            الصورة الحالية:{" "}
                            <a
                              href={editCourse.image}
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

        {/* مودال عرض المتقدمين */}
        <div
          className="modal fade"
          id="applicantsModal"
          tabIndex="-1"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center gap-2">
                  <span>
                    المتقدمون — {selectedCourseForApplicants?.title_ar || ""}
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
                      isApplicantsLoading || !selectedCourseForApplicants
                    }
                    title="تحديث"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i> تحديث
                  </button>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  ></button>
                </div>
              </div>

              <div className="modal-body">
                {isApplicantsLoading && (
                  <div className="d-flex justify-content-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

                {applicantsError && (
                  <div
                    className="alert alert-danger d-flex align-items-center"
                    role="alert"
                  >
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{applicantsError}</div>
                  </div>
                )}

                {!isApplicantsLoading && !applicantsError && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div className="alert alert-info py-2 px-3 mb-0">
                        <i className="bi bi-people-fill me-1"></i>
                        إجمالي المتقدمين:{" "}
                        <strong>{applicantsCount ?? 0}</strong>
                      </div>
                      <div className="text-muted small">
                        {selectedCourseForApplicants?.slug
                          ? `/${selectedCourseForApplicants.slug}`
                          : ""}
                      </div>
                    </div>

                    {!applicants.headers?.length ? (
                      <div className="text-muted">لا توجد بيانات لعرضها.</div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table table-sm table-striped align-middle">
                          <thead className="table-light">
                            <tr>
                              {applicants.headers.map((h, i) => (
                                <th key={i} className="text-nowrap">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {applicants.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {applicants.headers.map((_, cIdx) => (
                                  <td key={cIdx}>{row[cIdx] ?? ""}</td>
                                ))}
                              </tr>
                            ))}
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
      </div>
    </ProtectedRoute>
  );
}
