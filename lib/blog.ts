import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = path.join(process.cwd(), "content", "blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
  contentHtml: string;
}

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  category: string;
}

function findMarkdownFiles(
  dir: string,
  relativeTo: string
): { slug: string; absolutePath: string }[] {
  const results: { slug: string; absolutePath: string }[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath, relativeTo));
    } else if (entry.name.endsWith(".md")) {
      const slug = path
        .relative(relativeTo, fullPath)
        .replace(/\.md$/, "")
        .split(path.sep)
        .join("/");
      results.push({ slug, absolutePath: fullPath });
    }
  }
  return results;
}

function slugToCategory(slug: string): string {
  const dir = path.dirname(slug);
  return dir === "." ? "" : dir.split(path.sep).join("/");
}

export function getAllPostSlugs(): string[] {
  return findMarkdownFiles(postsDirectory, postsDirectory).map((f) => f.slug);
}

export function getAllPosts(): BlogPostMeta[] {
  const files = findMarkdownFiles(postsDirectory, postsDirectory);

  const posts: BlogPostMeta[] = files.map(({ slug, absolutePath }) => {
    const fileContents = fs.readFileSync(absolutePath, "utf8");
    const { data } = matter(fileContents);

    return {
      slug,
      title: data.title || "",
      description: data.description || "",
      date: data.date || "",
      tags: data.tags || [],
      category: slugToCategory(slug),
    };
  });

  return posts.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const fullPath = path.join(postsDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) return null;

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const processedContent = await remark().use(html).process(content);
  const contentHtml = processedContent.toString();

  return {
    slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    tags: data.tags || [],
    category: slugToCategory(slug),
    contentHtml,
  };
}

export function getAllCategories(): string[] {
  const posts = getAllPosts();
  const categories = new Set<string>();

  for (const post of posts) {
    if (!post.category) continue;
    const parts = post.category.split("/");
    for (let i = 1; i <= parts.length; i++) {
      categories.add(parts.slice(0, i).join("/"));
    }
  }

  return Array.from(categories).sort();
}

export function getPostsByCategory(category: string): BlogPostMeta[] {
  return getAllPosts().filter(
    (post) =>
      post.category === category || post.category.startsWith(`${category}/`)
  );
}

export function getPostsByTag(tag: string): BlogPostMeta[] {
  return getAllPosts().filter((post) => post.tags.includes(tag));
}

export function getAllTags(): string[] {
  const tags = new Set<string>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}
