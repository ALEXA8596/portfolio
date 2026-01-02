import resumeData from "@/data/resume.json";

export default function Introduction() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-6 leading-tight">
          Hi, I&apos;m{" "}
          <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {resumeData.profile.name}
          </span>
        </h1>
        <h2 className="text-xl md:text-2xl text-zinc-600 dark:text-zinc-300 mb-6">
          {resumeData.profile.title}
        </h2>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-8">
          {resumeData.profile.summary}
        </p>
        <div className="flex flex-wrap gap-3">
          {resumeData.skills.slice(0, 8).map((skill) => (
            <span
              key={skill}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-full text-sm font-medium"
            >
              {skill}
            </span>
          ))}
          {resumeData.skills.length > 8 && (
            <span className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-full text-sm font-medium">
              +{resumeData.skills.length - 8} more
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
