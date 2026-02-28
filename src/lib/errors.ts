import { NextResponse } from "next/server"
import { ZodError } from "zod"

export class HttpError extends Error {
  status: number
  details?: unknown

  constructor(message: string, status: number, details?: unknown) {
    super(message)
    this.name = "HttpError"
    this.status = status
    this.details = details
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(message, 401)
    this.name = "UnauthorizedError"
  }
}

export class ValidationError extends HttpError {
  constructor(message = "Validation error", details?: unknown) {
    super(message, 400, details)
    this.name = "ValidationError"
  }
}

export class ForbiddenError extends HttpError {
  constructor(message = "Forbidden") {
    super(message, 403)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends HttpError {
  constructor(message = "Not found") {
    super(message, 404)
    this.name = "NotFoundError"
  }
}

export class ConflictError extends HttpError {
  constructor(message = "Conflict") {
    super(message, 409)
    this.name = "ConflictError"
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Validation error",
        details: error.flatten(),
      },
      { status: 400 }
    )
  }

  if (error instanceof HttpError) {
    const body: Record<string, unknown> = {
      message: error.message,
    }

    if (error.details) {
      body.details = error.details
    }

    return NextResponse.json(body, { status: error.status })
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ message: "Invalid JSON" }, { status: 400 })
  }

  return NextResponse.json(
    {
      message: `Internal server error ${error}`,
    },
    { status: 500 }
  )
}
