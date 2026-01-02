"use client";

import { useState, useEffect } from "react";

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

function formatDate(dateStr: string): string {
  if (dateStr === "present" || dateStr === "future") return "Present";
  const [year, month] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function PrintableResume() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem("resumeData");
    if (saved) {
      setResumeData(JSON.parse(saved));
    } else {
      // Try to fetch from API
      fetch("/api/resume")
        .then((res) => res.json())
        .then((data) => setResumeData(data))
        .catch(() => setResumeData(null));
    }
  }, []);

  if (!resumeData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading resume...</p>
      </div>
    );
  }

  const employment = resumeData.items.filter((i) => i.category === "employment");
  const education = resumeData.items.filter((i) => i.category === "education");
  const projects = resumeData.items.filter((i) => i.category === "project");
  const certifications = resumeData.items.filter((i) => i.category === "certification");

  return (
    <>
      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: letter;
            margin: 0.5in;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* Print Button */}
      <div className="no-print fixed top-4 right-4 flex gap-2 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shadow-lg"
        >
          Print Resume
        </button>
        <a
          href="/builder"
          className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600 shadow-lg"
        >
          Edit Resume
        </a>
      </div>

      {/* Resume Content */}
      <div className="print-container max-w-[8.5in] mx-auto bg-white p-8 min-h-screen text-black">
        {/* Header */}
        <header className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold tracking-wide uppercase">
            {resumeData.profile.name}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{resumeData.profile.title}</p>
          <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-700">
            {resumeData.profile.email && (
              <span>{resumeData.profile.email}</span>
            )}
            {resumeData.profile.phone && (
              <span>{resumeData.profile.phone}</span>
            )}
            {resumeData.profile.location && (
              <span>{resumeData.profile.location}</span>
            )}
            {resumeData.profile.website && (
              <span>{resumeData.profile.website}</span>
            )}
            {resumeData.profile.linkedin && (
              <span>linkedin.com/in/{resumeData.profile.linkedin}</span>
            )}
            {resumeData.profile.github && (
              <span>github.com/{resumeData.profile.github}</span>
            )}
          </div>
        </header>

        {/* Summary */}
        {resumeData.profile.summary && (
          <section className="mb-4">
            <p className="text-xs leading-relaxed text-gray-700">
              {resumeData.profile.summary}
            </p>
          </section>
        )}

        {/* Skills */}
        {resumeData.skills.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
              Skills
            </h2>
            <p className="text-xs text-gray-700">
              {resumeData.skills.join(" • ")}
            </p>
          </section>
        )}

        {/* Experience */}
        {employment.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
              Experience
            </h2>
            <div className="space-y-3">
              {employment.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className="text-xs text-gray-600">
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-gray-600 italic">{item.organization}</p>
                    <span className="text-xs text-gray-500">{item.location}</span>
                  </div>
                  {item.highlights.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-700 list-disc list-inside space-y-0.5">
                      {item.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Education */}
        {education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
              Education
            </h2>
            <div className="space-y-3">
              {education.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className="text-xs text-gray-600">
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs text-gray-600 italic">{item.organization}</p>
                    <span className="text-xs text-gray-500">{item.location}</span>
                  </div>
                  {item.highlights.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-700 list-disc list-inside space-y-0.5">
                      {item.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
              Projects
            </h2>
            <div className="space-y-3">
              {projects.map((item) => (
                <div key={item.id}>
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    <span className="text-xs text-gray-600">
                      {formatDate(item.startDate)} – {formatDate(item.endDate)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-600 italic">{item.description}</p>
                  )}
                  {item.highlights.length > 0 && (
                    <ul className="mt-1 text-xs text-gray-700 list-disc list-inside space-y-0.5">
                      {item.highlights.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-300 pb-1 mb-2">
              Certifications
            </h2>
            <div className="space-y-2">
              {certifications.map((item) => (
                <div key={item.id} className="flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-semibold">{item.title}</span>
                    <span className="text-xs text-gray-600"> – {item.organization}</span>
                  </div>
                  <span className="text-xs text-gray-600">{formatDate(item.endDate)}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
