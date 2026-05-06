"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

export type RegisterState = {
  error?: string;
};

export async function registerUser(
  _prev: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const name =
    typeof rawName === "string" && rawName.trim().length > 0
      ? rawName.trim()
      : null;
  const email =
    typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const password = typeof rawPassword === "string" ? rawPassword : "";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Geçerli bir e-posta adresi girin." };
  }
  if (password.length < 8) {
    return { error: "Parola en az 8 karakter olmalıdır." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Bu e-posta adresi zaten kayıtlı." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "reader",
    },
  });

  redirect("/login?registered=1");
}
