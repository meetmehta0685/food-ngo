import { hash } from "bcryptjs";

import { ok, fail } from "@/lib/api/response";
import { consumeRateLimit, getRequestIp } from "@/lib/api/rate-limit";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const limiter = consumeRateLimit({
    key: `register:${getRequestIp(request)}`,
    limit: 12,
    windowMs: 60_000,
  });

  if (!limiter.allowed) {
    return fail(
      "RATE_LIMITED",
      "Too many registration attempts. Try again shortly.",
      429,
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return fail(
        "VALIDATION_ERROR",
        "Invalid registration data",
        400,
        parsed.error.flatten(),
      );
    }

    const email = parsed.data.email.trim().toLowerCase();

    const existing = await db.user.findUnique({ where: { email } });

    if (existing) {
      return fail("EMAIL_TAKEN", "Email is already registered", 409);
    }

    const passwordHash = await hash(parsed.data.password, 10);

    const created = await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.name,
          email,
          passwordHash,
          role: parsed.data.role,
        },
      });

      if (parsed.data.role === "NGO" && parsed.data.ngoProfile) {
        await tx.ngoProfile.create({
          data: {
            userId: user.id,
            orgName: parsed.data.ngoProfile.orgName,
            phone: parsed.data.ngoProfile.phone,
            address: parsed.data.ngoProfile.address,
            lat: parsed.data.ngoProfile.lat,
            lng: parsed.data.ngoProfile.lng,
            serviceRadiusKm: parsed.data.ngoProfile.serviceRadiusKm,
          },
        });
      }

      return user;
    });

    return ok({
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
      },
    });
  } catch (error) {
    console.error("register route error", error);
    return fail("INTERNAL_ERROR", "Failed to create account", 500);
  }
}
