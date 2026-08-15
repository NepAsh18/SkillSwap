import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getMyProfile,
  updateMyProfile,
  uploadProfilePicture,
  addEducation,
  updateEducation,
  deleteEducation,
  addProject,
  updateProject,
  deleteProject,
} from "../api/profileService";


const EDITABLE_FIELDS = [
  "name",
  "username",
  "picture",
  "linkedinLink",
  "githubLink",
  "portfolioLink",
  "bio",
  "skillsProficient",
  "skillsToLearn",
];

const FIELD_LIMITS = {
  name: 50,
  username: 100,
  linkedinLink: 200,
  githubLink: 200,
  portfolioLink: 500,
  bio: 2000,
  skillsProficient: 2000,
  skillsToLearn: 2000,
};

function pickEditable(source) {
  const out = {};
  EDITABLE_FIELDS.forEach((k) => (out[k] = source?.[k] ?? ""));
  return out;
}

function formatDate(value) {
  if (!value) return "Present";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
    });
  } catch {
    return value;
  }
}

function splitTags(str) {
  return (str || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// yyyy-mm-dd <-> Instant helpers for <input type="date">
function toDateInputValue(instant) {
  if (!instant) return "";
  return new Date(instant).toISOString().slice(0, 10);
}
function fromDateInputValue(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString();
}

const EDUCATION_FORM_FIELDS = [
  { name: "institution", label: "Institution", required: true },
  { name: "degree", label: "Degree", required: true },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
  { name: "score", label: "Score", type: "number" },
  { name: "description", label: "Description", textarea: true },
];

const PROJECT_FORM_FIELDS = [
  { name: "title", label: "Title", required: true },
  { name: "projectLink", label: "Project link", type: "url" },
  { name: "techStack", label: "Tech stack (comma separated)" },
  { name: "startDate", label: "Start date", type: "date" },
  { name: "endDate", label: "End date", type: "date" },
  { name: "description", label: "Description", textarea: true },
];

function emptyEducationForm() {
  return { institution: "", degree: "", startDate: "", endDate: "", score: "", description: "" };
}
function emptyProjectForm() {
  return { title: "", projectLink: "", techStack: "", startDate: "", endDate: "", description: "" };
}

// ==========================================
// Data / logic hook
// ==========================================
function useProfileLogic() {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    window.clearTimeout(showMessage._t);
    showMessage._t = window.setTimeout(() => setMessage({ type: "", text: "" }), 4000);
  };

  const loadProfileData = async () => {
    try {
      setLoading(true);
      const data = await getMyProfile();
      setProfile(data);
      setFormData(pickEditable(data));
    } catch (error) {
      showMessage("error", "Couldn't load your profile. Try refreshing.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const limit = FIELD_LIMITS[name];
    if (limit && value.length > limit) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    try {
      setSaving(true);
      const payload = pickEditable(formData); // only ever send the 9 allowed fields
      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setFormData(pickEditable(updated));
      setIsEditing(false);
      showMessage("success", "Profile updated.");
    } catch (error) {
      showMessage("error", "Save failed. Nothing was lost — try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(pickEditable(profile));
    setAvatarPreview(null);
    setIsEditing(false);
    setMessage({ type: "", text: "" });
  };

  // ---- Avatar upload: this is the piece the old page never implemented ----
  // Flow: validate file -> optimistic local preview via object URL ->
  // upload bytes to the backend -> backend returns the hosted URL ->
  // persist that URL immediately (avatar isn't gated behind "Edit Profile" /
  // "Save Changes", same as GitHub/LinkedIn-style profile pages).
  const handleAvatarSelect = async (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("error", "Please choose an image file.");
      return;
    }
    const MAX_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      showMessage("error", "Image must be under 5MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setAvatarPreview(objectUrl);
    setAvatarUploading(true);

    try {
      const { url } = await uploadProfilePicture(file);
      const updated = await updateMyProfile({ ...pickEditable(formData), picture: url });
      setProfile(updated);
      setFormData(pickEditable(updated));
      showMessage("success", "Profile picture updated.");
    } catch (error) {
      showMessage("error", "Upload failed. Your old picture is unchanged.");
    } finally {
      setAvatarUploading(false);
      URL.revokeObjectURL(objectUrl);
      setAvatarPreview(null);
    }
  };

  return {
    profile,
    formData,
    loading,
    saving,
    isEditing,
    setIsEditing,
    message,
    handleInputChange,
    handleSave,
    handleCancel,
    avatarUploading,
    avatarPreview,
    handleAvatarSelect,
  };
}

// ==========================================
// Small presentational pieces
// ==========================================
function SectionHeading({ eyebrow, title }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <span className="font-mono text-[10px] tracking-[0.2em] text-[#C9A227] uppercase">
        {eyebrow}
      </span>
      <span className="h-px flex-1 bg-white/10" />
      <span className="font-mono text-[10px] text-white/25">§</span>
    </div>
  );
}

function Field({ label, name, value, onChange, disabled, limit, type = "text", textarea, placeholder }) {
  const Comp = textarea ? "textarea" : "input";
  return (
    <label className="block space-y-1.5">
      <span className="flex items-baseline justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
          {label}
        </span>
        {limit && !disabled && (
          <span className="font-mono text-[10px] text-white/25">
            {(value || "").length}/{limit}
          </span>
        )}
      </span>
      <Comp
        type={textarea ? undefined : type}
        name={name}
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        rows={textarea ? 4 : undefined}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors
          ${textarea ? "resize-none" : ""}
          ${
            disabled
              ? "border-white/5 bg-white/[0.02] text-white/60"
              : "border-white/10 bg-[#0E1319] text-white/90 focus:border-[#5B8DB8] focus:bg-[#0B0F14]"
          }`}
      />
    </label>
  );
}

function Tag({ children, tone = "steel" }) {
  const tones = {
    steel: "border-[#5B8DB8]/30 bg-[#5B8DB8]/10 text-[#8FB8DA]",
    brass: "border-[#C9A227]/30 bg-[#C9A227]/10 text-[#E0BE5C]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function EntryModal({ open, kind, mode, fields, form, onChange, onClose, onSubmit, saving }) {
  if (!open) return null;
  const titleText = `${mode === "edit" ? "Edit" : "Add"} ${kind === "education" ? "education" : "project"}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-[#171F28] p-6 dossier-scroll"
      >
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-white">{titleText}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-white/40 hover:bg-white/5 hover:text-white/70"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-4"
        >
          {fields.map((f) => (
            <label key={f.name} className="block space-y-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
                {f.label}
                {f.required && <span className="text-[#D9776B]"> *</span>}
              </span>
              {f.textarea ? (
                <textarea
                  rows={3}
                  value={form[f.name] ?? ""}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  className="w-full resize-none rounded-lg border border-white/10 bg-[#0E1319] px-3.5 py-2.5 text-sm text-white/90 outline-none focus:border-[#5B8DB8]"
                />
              ) : (
                <input
                  type={f.type || "text"}
                  required={f.required}
                  step={f.type === "number" ? "0.01" : undefined}
                  value={form[f.name] ?? ""}
                  onChange={(e) => onChange(f.name, e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#0E1319] px-3.5 py-2.5 text-sm text-white/90 outline-none focus:border-[#5B8DB8]"
                />
              )}
            </label>
          ))}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-white/70 hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#5B8DB8] px-4 py-2 text-sm font-semibold text-[#0B0F14] hover:bg-[#71A0C7] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ==========================================
// Page
// ==========================================
export default function ProfilePage() {
  const {
    profile,
    formData,
    loading,
    saving,
    isEditing,
    setIsEditing,
    message,
    handleInputChange,
    handleSave,
    handleCancel,
    avatarUploading,
    avatarPreview,
    handleAvatarSelect,
  } = useProfileLogic();

  const fileInputRef = useRef(null);
  const [activeSection, setActiveSection] = useState("about");

  // Education/Projects are managed independently of the profile edit form —
  // they have their own endpoints, so they get their own local state,
  // seeded from the profile once it loads.
  const [educationList, setEducationList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  useEffect(() => {
    setEducationList(profile?.educationList || []);
    setProjectList(profile?.projectList || []);
  }, [profile]);

  const [modal, setModal] = useState(null); // { kind: 'education'|'project', mode: 'add'|'edit', id?, form }
  const [modalSaving, setModalSaving] = useState(false);

  const openAddEducation = () => setModal({ kind: "education", mode: "add", form: emptyEducationForm() });
  const openEditEducation = (edu) =>
    setModal({
      kind: "education",
      mode: "edit",
      id: edu.id,
      form: {
        institution: edu.institution || "",
        degree: edu.degree || "",
        startDate: toDateInputValue(edu.startDate),
        endDate: toDateInputValue(edu.endDate),
        score: edu.score ?? "",
        description: edu.description || "",
      },
    });

  const openAddProject = () => setModal({ kind: "project", mode: "add", form: emptyProjectForm() });
  const openEditProject = (proj) =>
    setModal({
      kind: "project",
      mode: "edit",
      id: proj.id,
      form: {
        title: proj.title || "",
        projectLink: proj.projectLink || "",
        techStack: proj.techStack || "",
        startDate: toDateInputValue(proj.startDate),
        endDate: toDateInputValue(proj.endDate),
        description: proj.description || "",
      },
    });

  const closeModal = () => setModal(null);
  const handleModalFieldChange = (name, value) =>
    setModal((prev) => ({ ...prev, form: { ...prev.form, [name]: value } }));

  const handleModalSubmit = async () => {
    if (!modal) return;
    setModalSaving(true);
    try {
      if (modal.kind === "education") {
        const payload = {
          institution: modal.form.institution,
          degree: modal.form.degree,
          startDate: fromDateInputValue(modal.form.startDate),
          endDate: fromDateInputValue(modal.form.endDate),
          score: modal.form.score === "" ? null : Number(modal.form.score),
          description: modal.form.description,
        };
        if (modal.mode === "add") {
          const created = await addEducation(payload);
          setEducationList((prev) => [...prev, created]);
        } else {
          const updated = await updateEducation(modal.id, payload);
          setEducationList((prev) => prev.map((e) => (e.id === modal.id ? updated : e)));
        }
      } else {
        const payload = {
          title: modal.form.title,
          projectLink: modal.form.projectLink,
          techStack: modal.form.techStack,
          startDate: fromDateInputValue(modal.form.startDate),
          endDate: fromDateInputValue(modal.form.endDate),
          description: modal.form.description,
        };
        if (modal.mode === "add") {
          const created = await addProject(payload);
          setProjectList((prev) => [...prev, created]);
        } else {
          const updated = await updateProject(modal.id, payload);
          setProjectList((prev) => prev.map((p) => (p.id === modal.id ? updated : p)));
        }
      }
      closeModal();
    } catch (error) {
      // A more elaborate UI could route this into the top-level toast;
      // kept local here since it's tied to a modal that's still open.
      alert(`Couldn't save that ${modal.kind} entry. Please try again.`);
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteEducation = async (id) => {
    if (!window.confirm("Remove this education entry?")) return;
    try {
      await deleteEducation(id);
      setEducationList((prev) => prev.filter((e) => e.id !== id));
    } catch {
      alert("Couldn't delete that entry. Please try again.");
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm("Remove this project?")) return;
    try {
      await deleteProject(id);
      setProjectList((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Couldn't delete that project. Please try again.");
    }
  };
  const sectionRefs = {
    about: useRef(null),
    skills: useRef(null),
    links: useRef(null),
    education: useRef(null),
    projects: useRef(null),
  };
  const scrollAreaRef = useRef(null);

  const sections = [
    { id: "about", label: "About" },
    { id: "skills", label: "Skills" },
    { id: "links", label: "Links" },
    { id: "education", label: "Education" },
    { id: "projects", label: "Projects" },
  ];

  const scrollToSection = (id) => {
    sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  // Highlight the nav item for whichever section is currently in view
  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.dataset?.section) {
          setActiveSection(visible.target.dataset.section);
        }
      },
      { root, threshold: [0.25, 0.5, 0.75] }
    );
    Object.values(sectionRefs).forEach((r) => r.current && observer.observe(r.current));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#12181F] font-mono text-sm text-white/40">
        loading profile…
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#12181F] font-mono text-sm text-[#D9776B]">
        Couldn't load this profile.
      </div>
    );
  }

 const avatarSrc =
  avatarPreview ||
  (profile.picture
    ? `http://localhost:8080${profile.picture}`
    : null);
  const initials = (profile.name || "?")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="h-screen w-full overflow-hidden bg-[#12181F] font-sans text-white/90">
      {/* subtle blueprint grid backdrop */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative mx-auto flex h-full max-w-6xl flex-col lg:flex-row">
        {/* ================= SIDEBAR — the "ID card" ================= */}
        <aside className="shrink-0 border-b border-white/10 px-6 py-8 lg:h-full lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:px-8">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171F28] p-6">
            {/* perforated edge, badge feel */}
            <div className="absolute inset-x-0 top-0 flex justify-between px-2 pt-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <span key={i} className="h-1 w-1 rounded-full bg-[#12181F]" />
              ))}
            </div>

            <div className="flex flex-col items-center pt-3 text-center">
              <div className="group relative">
                <div className="h-24 w-24 overflow-hidden rounded-full ring-2 ring-[#C9A227]/40 ring-offset-2 ring-offset-[#171F28]">
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={profile.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#0E1319] font-mono text-lg text-white/40">
                      {initials}
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change profile picture"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#C9A227] text-[#12181F] shadow-md transition-transform hover:scale-105 active:scale-95"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleAvatarSelect(e.target.files?.[0])}
                />
              </div>

              <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-white">
                {profile.name}
              </h1>
              <p className="mt-0.5 font-mono text-xs text-white/40">@{profile.username}</p>
              <p className="mt-1 text-xs text-white/50">{profile.email}</p>

              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {Array.from(profile.roles || []).map((role) => (
                  <Tag key={role} tone="brass">
                    {role.replace("ROLE_", "")}
                  </Tag>
                ))}
              </div>

              <div className="mt-4 w-full border-t border-white/10 pt-3 text-left font-mono text-[10px] text-white/35">
                <div className="flex justify-between">
                  <span>Auth</span>
                  <span className="text-white/60">{profile.provider}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span>Member since</span>
                  <span className="text-white/60">{formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="mt-4 w-full rounded-xl bg-[#5B8DB8] py-2.5 text-sm font-semibold text-[#0B0F14] transition-colors hover:bg-[#71A0C7]"
            >
              Edit profile
            </button>
          ) : (
            <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-wide text-[#8FB8DA]">
              editing mode
            </p>
          )}

          {/* section nav — desktop only, since the panel scrolls independently */}
          <nav className="mt-6 hidden flex-col gap-1 lg:flex">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollToSection(s.id)}
                className={`rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeSection === s.id
                    ? "bg-white/[0.06] text-white"
                    : "text-white/40 hover:bg-white/[0.03] hover:text-white/70"
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* ================= SCROLLABLE DOSSIER PANEL ================= */}
        <main
          ref={scrollAreaRef}
          className="dossier-scroll min-h-0 flex-1 overflow-y-auto px-6 py-8 lg:px-10"
        >
          <AnimatePresence>
            {message.text && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 rounded-lg border px-4 py-3 text-sm font-medium ${
                  message.type === "success"
                    ? "border-[#4C9A6A]/30 bg-[#4C9A6A]/10 text-[#7FC89A]"
                    : "border-[#D9776B]/30 bg-[#D9776B]/10 text-[#E39A90]"
                }`}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSave} className="space-y-12 pb-28">
            {/* ABOUT */}
            <section ref={sectionRefs.about} data-section="about">
              <SectionHeading eyebrow="01 — Identity" title="About" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Display name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  limit={FIELD_LIMITS.name}
                />
                <Field
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  limit={FIELD_LIMITS.username}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    limit={FIELD_LIMITS.bio}
                    textarea
                    placeholder="A couple of sentences about what you build and what you're into."
                  />
                </div>
              </div>
            </section>

            {/* SKILLS */}
            <section ref={sectionRefs.skills} data-section="skills">
              <SectionHeading eyebrow="02 — Exchange" title="Skills" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Field
                    label="Proficient in"
                    name="skillsProficient"
                    value={formData.skillsProficient}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    limit={FIELD_LIMITS.skillsProficient}
                    textarea
                    placeholder="Spring Boot, React, PostgreSQL"
                  />
                  {!isEditing && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {splitTags(formData.skillsProficient).map((s) => (
                        <Tag key={s} tone="steel">{s}</Tag>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Field
                    label="Want to learn"
                    name="skillsToLearn"
                    value={formData.skillsToLearn}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    limit={FIELD_LIMITS.skillsToLearn}
                    textarea
                    placeholder="Kubernetes, AWS, Go"
                  />
                  {!isEditing && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {splitTags(formData.skillsToLearn).map((s) => (
                        <Tag key={s} tone="brass">{s}</Tag>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* LINKS */}
            <section ref={sectionRefs.links} data-section="links">
              <SectionHeading eyebrow="03 — Elsewhere" title="Links" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field
                  label="GitHub"
                  name="githubLink"
                  type="url"
                  value={formData.githubLink}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  limit={FIELD_LIMITS.githubLink}
                  placeholder="https://github.com/you"
                />
                <Field
                  label="LinkedIn"
                  name="linkedinLink"
                  type="url"
                  value={formData.linkedinLink}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  limit={FIELD_LIMITS.linkedinLink}
                  placeholder="https://linkedin.com/in/you"
                />
                <Field
                  label="Portfolio"
                  name="portfolioLink"
                  type="url"
                  value={formData.portfolioLink}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  limit={FIELD_LIMITS.portfolioLink}
                  placeholder="https://you.dev"
                />
              </div>
            </section>

            {/* EDUCATION */}
            <section ref={sectionRefs.education} data-section="education">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex flex-1 items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#C9A227] uppercase">
                    04 — Record
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={openAddEducation}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                >
                  + Add
                </button>
              </div>

              {educationList.length === 0 ? (
                <EmptyRow text="No education added yet." />
              ) : (
                <div className="space-y-3">
                  {educationList.map((edu) => (
                    <div
                      key={edu.id}
                      className="group rounded-xl border border-white/10 bg-white/[0.02] p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-semibold text-white/90">{edu.degree}</p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] text-white/40">
                            {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                          </span>
                          <div className="hidden gap-2 group-hover:flex">
                            <button
                              type="button"
                              onClick={() => openEditEducation(edu)}
                              className="text-[11px] text-[#8FB8DA] hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteEducation(edu.id)}
                              className="text-[11px] text-[#E39A90] hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                      <p className="mt-0.5 text-sm text-white/50">{edu.institution}</p>
                      {edu.score != null && edu.score !== "" && (
                        <p className="mt-1 font-mono text-[11px] text-[#8FB8DA]">
                          Score: {edu.score}
                        </p>
                      )}
                      {edu.description && (
                        <p className="mt-2 text-sm leading-relaxed text-white/60">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* PROJECTS */}
            <section ref={sectionRefs.projects} data-section="projects">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex flex-1 items-baseline gap-3">
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#C9A227] uppercase">
                    05 — Built
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>
                <button
                  type="button"
                  onClick={openAddProject}
                  className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/5"
                >
                  + Add
                </button>
              </div>

              {projectList.length === 0 ? (
                <EmptyRow text="No projects added yet." />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {projectList.map((proj) => (
                    <div
                      key={proj.id}
                      className="group relative rounded-xl border border-white/10 bg-white/[0.02] p-4 transition-colors hover:border-[#5B8DB8]/40 hover:bg-white/[0.04]"
                    >
                      <div className="absolute right-3 top-3 hidden gap-2 group-hover:flex">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            openEditProject(proj);
                          }}
                          className="rounded-md bg-[#12181F]/90 px-2 py-1 text-[11px] text-[#8FB8DA] hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            handleDeleteProject(proj.id);
                          }}
                          className="rounded-md bg-[#12181F]/90 px-2 py-1 text-[11px] text-[#E39A90] hover:underline"
                        >
                          Delete
                        </button>
                      </div>

                      <a
                        href={proj.projectLink || undefined}
                        target={proj.projectLink ? "_blank" : undefined}
                        rel="noreferrer"
                        className="block"
                        onClick={(e) => { if (!proj.projectLink) e.preventDefault(); }}
                      >
                        <div className="flex items-start justify-between gap-2 pr-16">
                          <p className="font-semibold text-white/90">{proj.title}</p>
                          {proj.projectLink && <span className="mt-0.5 shrink-0 text-white/30">↗</span>}
                        </div>
                        <p className="mt-1 font-mono text-[10px] text-white/35">
                          {formatDate(proj.startDate)} – {formatDate(proj.endDate)}
                        </p>
                        {proj.description && (
                          <p className="mt-2 text-sm leading-relaxed text-white/60">{proj.description}</p>
                        )}
                        {proj.techStack && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {splitTags(proj.techStack).map((t) => (
                              <Tag key={t} tone="steel">{t}</Tag>
                            ))}
                          </div>
                        )}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </form>

          {/* Sticky save bar */}
          <AnimatePresence>
            {isEditing && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 gap-3 rounded-2xl border border-white/10 bg-[#171F28]/95 p-3 shadow-2xl backdrop-blur-md lg:left-[calc(50%+150px)]"
              >
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-xl border border-white/10 px-5 py-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-[#4C9A6A] px-5 py-2.5 text-sm font-semibold text-[#0B0F14] transition-colors hover:bg-[#5FB37E] disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {modal && (
          <EntryModal
            open={!!modal}
            kind={modal.kind}
            mode={modal.mode}
            fields={modal.kind === "education" ? EDUCATION_FORM_FIELDS : PROJECT_FORM_FIELDS}
            form={modal.form}
            onChange={handleModalFieldChange}
            onClose={closeModal}
            onSubmit={handleModalSubmit}
            saving={modalSaving}
          />
        )}
      </AnimatePresence>

      <style>{`
        .dossier-scroll::-webkit-scrollbar { width: 8px; }
        .dossier-scroll::-webkit-scrollbar-track { background: transparent; }
        .dossier-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 8px; }
        .dossier-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        .dossier-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.15) transparent; }
        aside::-webkit-scrollbar { width: 6px; }
        aside::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 8px; }
      `}</style>
    </div>
  );
}

function EmptyRow({ text }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-white/30">
      {text}
    </div>
  );
}

