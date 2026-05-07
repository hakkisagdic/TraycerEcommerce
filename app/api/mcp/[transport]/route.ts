import { createMcpHandler } from "mcp-handler";
import { headers as nextHeaders } from "next/headers";
import { z } from "zod";
import type { Prisma } from "@prisma/client";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { searchPosts } from "@/lib/search";

type AdminSession = {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    role: "admin";
  };
};

const ALLOWED_POST_STATUSES = ["draft", "published"] as const;
const ALLOWED_COMMENT_STATUSES = ["pending", "approved", "rejected"] as const;

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

function errorResult(message: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: message }, null, 2),
      },
    ],
    isError: true,
  };
}

async function getAdminContext(): Promise<{
  session: AdminSession | null;
  isAdmin: boolean;
}> {
  const session = await auth();
  if (session?.user?.role === "admin" && session.user.id) {
    return { session: session as unknown as AdminSession, isAdmin: true };
  }

  const token = process.env.MCP_ADMIN_TOKEN;
  if (token && token.length > 0) {
    const headerList = await nextHeaders();
    const header = headerList.get("authorization") ?? headerList.get("x-mcp-admin-token");
    const presented = header?.startsWith("Bearer ")
      ? header.slice(7)
      : header ?? "";
    if (presented && presented === token) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "admin" },
        orderBy: { createdAt: "asc" },
        select: { id: true, email: true, name: true },
      });
      if (adminUser) {
        return {
          session: {
            user: {
              id: adminUser.id,
              email: adminUser.email,
              name: adminUser.name,
              role: "admin",
            },
          },
          isAdmin: true,
        };
      }
    }
  }

  return { session: null, isAdmin: false };
}

async function requireAdmin() {
  const ctx = await getAdminContext();
  if (!ctx.isAdmin || !ctx.session) {
    return { error: "Unauthorized: admin role required", session: null };
  }
  return { error: null, session: ctx.session };
}

const handler = createMcpHandler(
  (server) => {
  server.tool(
    "list_posts",
    "List blog posts with optional filtering by status, category, and tag. Supports pagination.",
    {
      status: z.enum(ALLOWED_POST_STATUSES).optional(),
      categoryId: z.string().optional(),
      tag: z.string().optional(),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(10),
    },
    async ({ status, categoryId, tag, page, limit }) => {
      const { isAdmin } = await getAdminContext();

      const where: Prisma.PostWhereInput = {};

      if (status) {
        if (!isAdmin && status !== "published") {
          return errorResult("Unauthorized");
        }
        where.status = status;
      } else if (!isAdmin) {
        where.status = "published";
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (tag) {
        where.tags = { some: { tag: { slug: tag } } };
      }

      const authorSelect = isAdmin
        ? { id: true, name: true, email: true }
        : { id: true, name: true };

      const [items, total] = await Promise.all([
        prisma.post.findMany({
          where,
          include: {
            category: true,
            tags: { include: { tag: true } },
            author: { select: authorSelect },
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.post.count({ where }),
      ]);

      return jsonResult({
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    },
  );

  server.tool(
    "get_post",
    "Fetch a single blog post by its ID, including category, tags, author, and approved comments.",
    {
      id: z.string().min(1),
    },
    async ({ id }) => {
      const { isAdmin } = await getAdminContext();
      const authorSelect = isAdmin
        ? { id: true, name: true, email: true }
        : { id: true, name: true };

      const post = await prisma.post.findUnique({
        where: { id },
        include: {
          category: true,
          tags: { include: { tag: true } },
          author: { select: authorSelect },
          comments: {
            where: { status: "approved" },
            orderBy: { createdAt: "desc" },
            include: { author: { select: { id: true, name: true } } },
          },
        },
      });

      if (!post) {
        return errorResult("Not found");
      }

      if (post.status !== "published" && !isAdmin) {
        return errorResult("Not found");
      }

      return jsonResult(post);
    },
  );

  server.tool(
    "create_post",
    "Create a new blog post. Requires admin authentication.",
    {
      title: z.string().min(1),
      slug: z.string().min(1),
      contentJson: z.string().min(1),
      contentText: z.string().min(1),
      excerpt: z.string().optional(),
      status: z.enum(ALLOWED_POST_STATUSES).optional(),
      featuredImage: z.string().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
      categoryId: z.string().optional(),
      tagIds: z.array(z.string()).optional(),
      publishedAt: z.string().optional(),
    },
    async (input) => {
      const adminCheck = await requireAdmin();
      if (adminCheck.error || !adminCheck.session) {
        return errorResult(adminCheck.error ?? "Unauthorized");
      }

      const slug = input.slug.trim();
      const existing = await prisma.post.findUnique({ where: { slug } });
      if (existing) {
        return errorResult("Slug already in use");
      }

      const status = input.status ?? "draft";

      const publishedAt =
        status === "published"
          ? input.publishedAt
            ? new Date(input.publishedAt)
            : new Date()
          : input.publishedAt
            ? new Date(input.publishedAt)
            : null;

      const created = await prisma.post.create({
        data: {
          title: input.title.trim(),
          slug,
          contentJson: input.contentJson,
          contentText: input.contentText,
          excerpt: input.excerpt ?? null,
          status,
          featuredImage: input.featuredImage ?? null,
          seoTitle: input.seoTitle ?? null,
          seoDescription: input.seoDescription ?? null,
          publishedAt,
          authorId: adminCheck.session.user.id,
          categoryId:
            input.categoryId && input.categoryId.length > 0
              ? input.categoryId
              : null,
          tags:
            input.tagIds && input.tagIds.length > 0
              ? { create: input.tagIds.map((tagId) => ({ tagId })) }
              : undefined,
        },
        include: {
          category: true,
          tags: { include: { tag: true } },
          author: { select: { id: true, name: true, email: true } },
        },
      });

      return jsonResult(created);
    },
  );

  server.tool(
    "update_post",
    "Update an existing blog post by ID. Requires admin authentication. All fields except ID are optional.",
    {
      id: z.string().min(1),
      title: z.string().optional(),
      slug: z.string().optional(),
      contentJson: z.string().optional(),
      contentText: z.string().optional(),
      excerpt: z.string().nullable().optional(),
      status: z.enum(ALLOWED_POST_STATUSES).optional(),
      featuredImage: z.string().nullable().optional(),
      seoTitle: z.string().nullable().optional(),
      seoDescription: z.string().nullable().optional(),
      categoryId: z.string().nullable().optional(),
      tagIds: z.array(z.string()).optional(),
      publishedAt: z.string().nullable().optional(),
    },
    async (input) => {
      const adminCheck = await requireAdmin();
      if (adminCheck.error) {
        return errorResult(adminCheck.error);
      }

      const existing = await prisma.post.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        return errorResult("Not found");
      }

      if (typeof input.slug === "string" && input.slug.trim() !== existing.slug) {
        const conflict = await prisma.post.findUnique({
          where: { slug: input.slug.trim() },
        });
        if (conflict && conflict.id !== existing.id) {
          return errorResult("Slug already in use");
        }
      }

      const status = input.status ?? existing.status;

      const data: Prisma.PostUpdateInput = {};
      if (typeof input.title === "string") data.title = input.title.trim();
      if (typeof input.slug === "string") data.slug = input.slug.trim();
      if (typeof input.contentJson === "string")
        data.contentJson = input.contentJson;
      if (typeof input.contentText === "string")
        data.contentText = input.contentText;
      if ("excerpt" in input) data.excerpt = input.excerpt ?? null;
      if (status !== existing.status) {
        data.status = status;
        if (status === "published" && !existing.publishedAt) {
          data.publishedAt = new Date();
        }
      }
      if ("featuredImage" in input)
        data.featuredImage = input.featuredImage ?? null;
      if ("seoTitle" in input) data.seoTitle = input.seoTitle ?? null;
      if ("seoDescription" in input)
        data.seoDescription = input.seoDescription ?? null;
      if ("publishedAt" in input) {
        data.publishedAt = input.publishedAt
          ? new Date(input.publishedAt)
          : null;
      }
      if ("categoryId" in input) {
        data.category =
          input.categoryId && input.categoryId.length > 0
            ? { connect: { id: input.categoryId } }
            : { disconnect: true };
      }

      const tagIds = input.tagIds ?? null;

      const updated = await prisma.$transaction(async (tx) => {
        const post = await tx.post.update({
          where: { id: input.id },
          data,
        });

        if (tagIds !== null) {
          await tx.postTag.deleteMany({ where: { postId: post.id } });
          if (tagIds.length > 0) {
            await tx.postTag.createMany({
              data: tagIds.map((tagId) => ({ postId: post.id, tagId })),
            });
          }
        }

        return tx.post.findUnique({
          where: { id: post.id },
          include: {
            category: true,
            tags: { include: { tag: true } },
            author: { select: { id: true, name: true, email: true } },
          },
        });
      });

      return jsonResult(updated);
    },
  );

  server.tool(
    "delete_post",
    "Delete a blog post by ID. Requires admin authentication.",
    {
      id: z.string().min(1),
    },
    async ({ id }) => {
      const adminCheck = await requireAdmin();
      if (adminCheck.error) {
        return errorResult(adminCheck.error);
      }

      const existing = await prisma.post.findUnique({ where: { id } });
      if (!existing) {
        return errorResult("Not found");
      }

      await prisma.post.delete({ where: { id } });
      return jsonResult({ success: true });
    },
  );

  server.tool(
    "list_categories",
    "List all categories ordered by name.",
    {},
    async () => {
      const categories = await prisma.category.findMany({
        orderBy: { name: "asc" },
      });
      return jsonResult({ items: categories });
    },
  );

  server.tool(
    "create_category",
    "Create a new category. Requires admin authentication.",
    {
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
    },
    async ({ name, slug, description }) => {
      const adminCheck = await requireAdmin();
      if (adminCheck.error) {
        return errorResult(adminCheck.error);
      }

      const trimmedSlug = slug.trim();
      const existing = await prisma.category.findUnique({
        where: { slug: trimmedSlug },
      });
      if (existing) {
        return errorResult("Slug already in use");
      }

      const created = await prisma.category.create({
        data: {
          name: name.trim(),
          slug: trimmedSlug,
          description: description ?? null,
        },
      });
      return jsonResult(created);
    },
  );

  server.tool(
    "list_tags",
    "List all tags ordered by name.",
    {},
    async () => {
      const tags = await prisma.tag.findMany({ orderBy: { name: "asc" } });
      return jsonResult({ items: tags });
    },
  );

  server.tool(
    "create_tag",
    "Create a new tag. Requires admin authentication.",
    {
      name: z.string().min(1),
      slug: z.string().min(1),
    },
    async ({ name, slug }) => {
      const adminCheck = await requireAdmin();
      if (adminCheck.error) {
        return errorResult(adminCheck.error);
      }

      const trimmedSlug = slug.trim();
      const existing = await prisma.tag.findUnique({
        where: { slug: trimmedSlug },
      });
      if (existing) {
        return errorResult("Slug already in use");
      }

      const created = await prisma.tag.create({
        data: { name: name.trim(), slug: trimmedSlug },
      });
      return jsonResult(created);
    },
  );

  server.tool(
    "search_posts",
    "Full-text search across published posts. Returns matching post summaries.",
    {
      q: z.string().min(1),
    },
    async ({ q }) => {
      const results = await searchPosts(q);
      const items = results.map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        publishedAt: post.publishedAt,
      }));
      return jsonResult({ items });
    },
  );

  server.tool(
    "list_comments",
    "List comments with optional filtering by status and post. Requires admin authentication.",
    {
      status: z.enum(ALLOWED_COMMENT_STATUSES).optional(),
      postId: z.string().optional(),
    },
    async ({ status, postId }) => {
      const adminCheck = await requireAdmin();
      if (adminCheck.error) {
        return errorResult(adminCheck.error);
      }

      const where: Prisma.CommentWhereInput = {};
      if (status) where.status = status;
      if (postId) where.postId = postId;

      const comments = await prisma.comment.findMany({
        where,
        include: {
          author: { select: { id: true, name: true, email: true } },
          post: { select: { id: true, title: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      return jsonResult({ items: comments });
    },
  );
  },
  {},
  {
    basePath: "/api/mcp",
  },
);

export { handler as GET, handler as POST, handler as DELETE };
