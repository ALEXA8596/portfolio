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

interface PostFile {
  rawSlug: string;   // derived straight from filesystem path, may contain spaces/caps
  slug: string;       // slugified, URL-safe version
  absolutePath: string;
}

function slugifySegment(segment: string): string {
  return segment
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function slugifyPath(rawSlug: string): string {
  return rawSlug.split("/").map(slugifySegment).join("/");
}

function findMarkdownFiles(dir: string, relativeTo: string): PostFile[] {
  const results: PostFile[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath, relativeTo));
    } else if (entry.name.endsWith(".md")) {
      const rawSlug = path
        .relative(relativeTo, fullPath)
        .replace(/\.md$/, "")
        .split(path.sep)
        .join("/");
      results.push({ rawSlug, slug: slugifyPath(rawSlug), absolutePath: fullPath });
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
  const files = findMarkdownFiles(postsDirectory, postsDirectory);
  const match = files.find((f) => f.slug === slug);
  if (!match) return null;

  const fileContents = fs.readFileSync(match.absolutePath, "utf8");
  const { data, content } = matter(fileContents);

  const cleanedContent = content
    .replace(/!\[\[.*?\]\]/g, "")
    .replace(/\[\[(.*?)\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

  const processedContent = await remark().use(html).process(cleanedContent);
  const contentHtml = processedContent.toString();

  return {
    slug: match.slug,
    title: data.title || "",
    description: data.description || "",
    date: data.date || "",
    tags: data.tags || [],
    category: slugToCategory(match.slug),
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