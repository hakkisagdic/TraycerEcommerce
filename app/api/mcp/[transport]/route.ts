import { z } from "zod";
import { createMcpHandler } from "mcp-handler";
import { prisma } from "@/lib/prisma";
import { searchPosts } from "@/lib/search";

const listPostsInput = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(20).default(10),
});

const getPostInput = z.object({
  slug: z.string().min(1),
});

const searchPostsInput = z.object({
  q: z.string().min(1),
});

const buildToolResult = (data: unknown, message: string) => ({
  content: [{ type: "text" as const, text: message }],
  structuredContent: {
    data,
  },
});

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "list_posts",
      {
        title: "List published posts",
        description: "List published posts with pagination.",
        inputSchema: listPostsInput,
      },
      async ({ page, limit }, _extra) => {
        const parsed = listPostsInput.parse({ page, limit });
        const skip = (parsed.page - 1) * parsed.limit;
        const posts = await prisma.post.findMany({
          where: { status: "published" },
          orderBy: { publishedAt: "desc" },
          skip,
          take: parsed.limit,
          select: {
            id: true,
            title: true,
            slug: true,
            excerpt: true,
            publishedAt: true,
          },
        });
        return buildToolResult(posts, `Found ${posts.length} published posts.`);
      },
    );

    server.registerTool(
      "get_post",
      {
        title: "Get post by slug",
        description: "Retrieve a post by its slug.",
        inputSchema: getPostInput,
      },
      async ({ slug }, _extra) => {
        const post = await prisma.post.findUnique({
          where: { slug },
          include: {
            category: true,
            tags: { include: { tag: true } },
            author: { select: { id: true, name: true } },
          },
        });
        return buildToolResult(post, post ? "Post retrieved." : "Post not found.");
      },
    );

    server.registerTool(
      "search_posts",
      {
        title: "Search posts",
        description: "Search published posts using full-text search.",
        inputSchema: searchPostsInput,
      },
      async ({ q }, _extra) => {
        const results = await searchPosts(q);
        return buildToolResult(results, `Found ${results.length} matching posts.`);
      },
    );

    server.registerTool(
      "list_categories",
      {
        title: "List categories",
        description: "List all categories.",
      },
      async (_extra) => {
        const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });
        return buildToolResult(categories, `Found ${categories.length} categories.`);
      },
    );

    server.registerTool(
      "list_tags",
      {
        title: "List tags",
        description: "List all tags.",
      },
      async (_extra) => {
        const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
        return buildToolResult(tags, `Found ${tags.length} tags.`);
      },
    );
  },
  undefined,
  { basePath: "/api/mcp" },
);

export const GET = handler;
export const POST = handler;
