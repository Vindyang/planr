import { prisma } from "@/lib/prisma";
import { AuditAction, AuditEntityType } from "@prisma/client";

export async function createAuditLog(options: {
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  userId: string;
  changes?: { before?: any; after?: any };
  metadata?: Record<string, any>;
}) {
  try {
    await prisma.auditLog.create({ data: options });
  } catch (error) {
    console.error("Audit log failed:", error);
    // Don't throw - logging shouldn't break operations
  }
}

export function getRequestMetadata(request: Request) {
  return {
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
    timestamp: new Date().toISOString(),
  };
}
