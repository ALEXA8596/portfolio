import resumeData from "@/data/resume.json";

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

function parseDate(dateStr: string): Date {
  if (dateStr === "present") {
    return new Date();
  }
  const [year, month] = dateStr.split("-").map(Number);
  return new Date(year, month - 1);
}

function formatDateRange(startDate: string, endDate: string): string {
  const formatDate = (dateStr: string) => {
    if (dateStr === "present") return "Present";
    const date = parseDate(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export default function ProjectsPage() {
  const projects = resumeData.items.filter(
    (item) => item.category === "project"
  ) as ResumeItem[];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <main className="max-w-5xl mx-auto px-6 pt-32 pb-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            Projects
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            A collection of projects I&apos;ve worked on, from personal experiments to production applications.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-zinc-800 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {formatDateRange(project.startDate, project.endDate)}
                </span>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                {project.title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4">
                {project.description}
              </p>
              <ul className="space-y-2">
                {project.highlights.map((highlight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-zinc-500 dark:text-zinc-400"
                  >
                    <span className="text-purple-500 mt-1">•</span>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16 text-zinc-500 dark:text-zinc-400">
            No projects to display yet.
          </div>
        )}
      </main>
    </div>
  );
}
