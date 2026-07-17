import Link from "next/link";
import { getAllPosts, getAllCategories, getAllTags } from "@/lib/blog";

export const metadata = {
  title: "Blog | Alex's Portfolio",
  description: "Thoughts on web development, design, and career growth.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();
  const tags = getAllTags();

  return (
    <main className="max-w-5xl mx-auto px-6 pt-28 pb-16">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
          Blog
        </h1>
        <p className="text-lg text-zinc-600 dark:text-zinc-400">
          Thoughts on web development, design, and career growth.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-6">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  {post.category
                    .split("/")
                    .map((part) => part.replace(/-/g, " "))
                    .join(" / ")}
                </span>
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <time className="text-xs text-zinc-500 dark:text-zinc-500">
                  {post.date}
                </time>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
                {post.title}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-3">
                {post.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}

          {posts.length === 0 && (
            <p className="text-zinc-500 dark:text-zinc-400">
              No posts yet. Check back soon!
            </p>
          )}
        </div>

        <aside className="space-y-8">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wide mb-3">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="text-sm text-zinc-600 dark:text-zinc-400"
                >
                  {cat
                    .split("/")
                    .map((part) => part.replace(/-/g, " "))
                    .join(" / ")}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white uppercase tracking-wide mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
