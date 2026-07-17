import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllPostSlugs, getPostBySlug } from "@/lib/blog";

export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug: slug.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const post = await getPostBySlug(fullSlug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: `${post.title} | Blog`,
    description: post.description,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const fullSlug = slug.join("/");
  const post = await getPostBySlug(fullSlug);

  if (!post) {
    notFound();
  }

  const categoryDisplay = post.category
    ? post.category
        .split("/")
        .map((part) => part.replace(/-/g, " "))
        .join(" / ")
    : "";

  return (
    <main className="max-w-3xl mx-auto px-6 pt-28 pb-16">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors mb-8"
      >
        ← Back to Blog
      </Link>

      <article>
        <header className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              {categoryDisplay}
            </span>
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
            <time className="text-sm text-zinc-500 dark:text-zinc-500">
              {post.date}
            </time>
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            {post.title}
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-6">
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
        </header>

        <div
          className="prose prose-zinc dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-200 dark:prose-pre:border-zinc-700"
          dangerouslySetInnerHTML={{ __html: post.contentHtml }}
        />
      </article>
    </main>
  );
}
