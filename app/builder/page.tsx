"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ResumeItem = {
  id: string;
  category: string;
  title: string;
  organization: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
  highlights: string[];
};

type ResumeData = {
  profile: {
    name: string;
    title: string;
    email: string;
    location: string;
    summary: string;
    phone?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  items: ResumeItem[];
  skills: string[];
};

const defaultItem: ResumeItem = {
  id: "",
  category: "employment",
  title: "",
  organization: "",
  location: "",
  startDate: "",
  endDate: "",
  description: "",
  highlights: [],
};

export default function ResumeBuilder() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [editingItem, setEditingItem] = useState<ResumeItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [activeTab, setActiveTab] = useState<"profile" | "items" | "skills">("profile");

  useEffect(() => {
    // Load from localStorage or fetch from file
    const saved = localStorage.getItem("resumeData");
    if (saved) {
      setResumeData(JSON.parse(saved));
    } else {
      // Fetch default data
      fetch("/api/resume")
        .then((res) => res.json())
        .then((data) => setResumeData(data))
        .catch(() => {
          // Fallback empty resume
          setResumeData({
            profile: {
              name: "",
              title: "",
              email: "",
              location: "",
              summary: "",
            },
            items: [],
            skills: [],
          });
        });
    }
  }, []);

  const saveData = (data: ResumeData) => {
    setResumeData(data);
    localStorage.setItem("resumeData", JSON.stringify(data));
  };

  const updateProfile = (field: string, value: string) => {
    if (!resumeData) return;
    saveData({
      ...resumeData,
      profile: { ...resumeData.profile, [field]: value },
    });
  };

  const addItem = () => {
    setEditingItem({ ...defaultItem, id: `item-${Date.now()}` });
    setIsAddingNew(true);
  };

  const saveItem = () => {
    if (!resumeData || !editingItem) return;
    
    if (isAddingNew) {
      saveData({
        ...resumeData,
        items: [...resumeData.items, editingItem],
      });
    } else {
      saveData({
        ...resumeData,
        items: resumeData.items.map((item) =>
          item.id === editingItem.id ? editingItem : item
        ),
      });
    }
    setEditingItem(null);
    setIsAddingNew(false);
  };

  const deleteItem = (id: string) => {
    if (!resumeData) return;
    if (confirm("Are you sure you want to delete this item?")) {
      saveData({
        ...resumeData,
        items: resumeData.items.filter((item) => item.id !== id),
      });
    }
  };

  const addSkill = () => {
    if (!resumeData || !newSkill.trim()) return;
    saveData({
      ...resumeData,
      skills: [...resumeData.skills, newSkill.trim()],
    });
    setNewSkill("");
  };

  const removeSkill = (skill: string) => {
    if (!resumeData) return;
    saveData({
      ...resumeData,
      skills: resumeData.skills.filter((s) => s !== skill),
    });
  };

  const exportJSON = () => {
    if (!resumeData) return;
    const blob = new Blob([JSON.stringify(resumeData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        saveData(data);
      } catch {
        alert("Invalid JSON file");
      }
    };
    reader.readAsText(file);
  };

  if (!resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 pt-20">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Resume Builder
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-1">
              Edit your resume data interactively
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/resume/print"
              target="_blank"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Preview & Print
            </Link>
            <button
              onClick={exportJSON}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Export JSON
            </button>
            <label className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 transition-colors cursor-pointer">
              Import JSON
              <input
                type="file"
                accept=".json"
                onChange={importJSON}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-zinc-200 dark:bg-zinc-800 p-1 rounded-lg w-fit">
          {(["profile", "items", "skills"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
              Profile Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={resumeData.profile.name}
                  onChange={(e) => updateProfile("name", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={resumeData.profile.title}
                  onChange={(e) => updateProfile("title", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={resumeData.profile.email}
                  onChange={(e) => updateProfile("email", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={resumeData.profile.phone || ""}
                  onChange={(e) => updateProfile("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={resumeData.profile.location}
                  onChange={(e) => updateProfile("location", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={resumeData.profile.website || ""}
                  onChange={(e) => updateProfile("website", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  LinkedIn
                </label>
                <input
                  type="text"
                  value={resumeData.profile.linkedin || ""}
                  onChange={(e) => updateProfile("linkedin", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  GitHub
                </label>
                <input
                  type="text"
                  value={resumeData.profile.github || ""}
                  onChange={(e) => updateProfile("github", e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Summary
                </label>
                <textarea
                  value={resumeData.profile.summary}
                  onChange={(e) => updateProfile("summary", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Items Tab */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                Experience & Education
              </h2>
              <button
                onClick={addItem}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                + Add Item
              </button>
            </div>

            {/* Item Editor Modal */}
            {editingItem && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4">
                    {isAddingNew ? "Add New Item" : "Edit Item"}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Category
                      </label>
                      <select
                        value={editingItem.category}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, category: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      >
                        <option value="employment">Employment</option>
                        <option value="education">Education</option>
                        <option value="project">Project</option>
                        <option value="certification">Certification</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={editingItem.title}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, title: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Organization
                      </label>
                      <input
                        type="text"
                        value={editingItem.organization}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, organization: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={editingItem.location}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Start Date (YYYY-MM)
                      </label>
                      <input
                        type="text"
                        value={editingItem.startDate}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, startDate: e.target.value })
                        }
                        placeholder="2024-01"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        End Date (YYYY-MM or &quot;present&quot;)
                      </label>
                      <input
                        type="text"
                        value={editingItem.endDate}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, endDate: e.target.value })
                        }
                        placeholder="2024-12 or present"
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={editingItem.description}
                        onChange={(e) =>
                          setEditingItem({ ...editingItem, description: e.target.value })
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        Highlights (one per line)
                      </label>
                      <textarea
                        value={editingItem.highlights.join("\n")}
                        onChange={(e) =>
                          setEditingItem({
                            ...editingItem,
                            highlights: e.target.value.split("\n").filter((h) => h.trim()),
                          })
                        }
                        rows={4}
                        className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => {
                        setEditingItem(null);
                        setIsAddingNew(false);
                      }}
                      className="px-4 py-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveItem}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Items List */}
            {["employment", "education", "project", "certification"].map((category) => {
              const items = resumeData.items.filter((item) => item.category === category);
              if (items.length === 0) return null;
              return (
                <div key={category} className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 capitalize">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between p-4 bg-zinc-50 dark:bg-zinc-700/50 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium text-zinc-900 dark:text-white">
                            {item.title}
                          </h4>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {item.organization} • {item.startDate} - {item.endDate}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setIsAddingNew(false);
                            }}
                            className="px-3 py-1 text-sm text-blue-500 hover:text-blue-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="px-3 py-1 text-sm text-red-500 hover:text-red-600"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === "skills" && (
          <div className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">
              Skills
            </h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addSkill()}
                placeholder="Add a skill..."
                className="flex-1 px-3 py-2 border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white"
              />
              <button
                onClick={addSkill}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {resumeData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-zinc-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
