"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES = new Set(["draft", "published"]);

export type PostFormState = {
  error?: string;
};

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value.length > 0 ? value : null;
}

export async function savePost(
  _prevState: PostFormState,
  formData: FormData,
): Promise<PostFormState> {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const id = getString(formData, "id");
  const title = getString(formData, "title");
  const slug = getString(formData, "slug");
  const contentText = getString(formData, "contentText");
  const contentJson = getString(formData, "contentJson");
  const statusValue = getString(formData, "status");
  const status = ALLOWED_STATUSES.has(statusValue) ? statusValue : "draft";
  const categoryId = getNullableString(formData, "categoryId");
  const featuredImage = getNullableString(formData, "featuredImage");
  const seoTitle = getNullableString(formData, "seoTitle");
  const seoDescription = getNullableString(formData, "seoDescription");
  const tagIds = formData
    .getAll("tagIds")
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  if (!title) return { error: "Başlık boş olamaz." };
  if (!slug) return { error: "Slug boş olamaz." };
  if (!contentText) return { error: "İçerik boş olamaz." };

  const existing = id
    ? await prisma.post.findUnique({ where: { id } })
    : null;

  if (id && !existing) {
    return { error: "Yazı bulunamadı." };
  }

  const normalizedSlug = slug.toLowerCase();
  const slugConflict = await prisma.post.findUnique({ where: { slug: normalizedSlug } });
  if (slugConflict && slugConflict.id !== id) {
    return { error: "Slug zaten kullanılıyor." };
  }

  const publishedAt =
    status === "published"
      ? existing?.publishedAt ?? new Date()
      : existing?.publishedAt ?? null;

  const post = id
    ? await prisma.post.update({
        where: { id },
        data: {
          title,
          slug: normalizedSlug,
          contentText,
          contentJson,
          status,
          featuredImage,
          seoTitle,
          seoDescription,
          publishedAt,
          categoryId,
        },
      })
    : await prisma.post.create({
        data: {
          title,
          slug: normalizedSlug,
          contentText,
          contentJson,
          status,
          featuredImage,
          seoTitle,
          seoDescription,
          publishedAt,
          categoryId,
          authorId: session.user.id,
        },
      });

  await prisma.postTag.deleteMany({ where: { postId: post.id } });
  if (tagIds.length > 0) {
    await prisma.postTag.createMany({
      data: tagIds.map((tagId) => ({ postId: post.id, tagId })),
    });
  }

  revalidatePath("/");
  revalidatePath("/admin/posts");
  if (post.slug) {
    revalidatePath(`/posts/${post.slug}`);
  }

  redirect("/admin/posts");
}