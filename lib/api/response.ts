import { NextResponse } from "next/server"

import type { ApiErrorShape } from "@/lib/types"

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function fail(
  code: string,
  message: string,
  status: number,
  details?: unknown,
) {
  const payload: { error: ApiErrorShape } = {
    error: { code, message, details },
  }

  return NextResponse.json(payload, { status })
}
