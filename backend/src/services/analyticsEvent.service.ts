import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { CreateAnalyticsEventInput } from "../models/analyticsEvent.model";
import { assertFormOwnership, assertFormPublished } from "./formAccess";
import { classifyDevice, DeviceType } from "../utils/deviceDetection";

export const AnalyticsEventService = {
  async create(apiKeyId: string, formId: string, input: CreateAnalyticsEventInput) {
    await assertFormOwnership(apiKeyId, formId);

    return prisma.analyticsEvent.create({
      data: {
        formId,
        type: input.type,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  },

  // Public event tracking used by the client SDK: no API key, but only published forms accept events.
  async createPublic(formId: string, input: CreateAnalyticsEventInput) {
    await assertFormPublished(formId);

    return prisma.analyticsEvent.create({
      data: {
        formId,
        type: input.type,
        metadata: input.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  },

  async findAll(apiKeyId: string, formId: string) {
    await assertFormOwnership(apiKeyId, formId);

    return prisma.analyticsEvent.findMany({
      where: { formId },
      orderBy: { createdAt: "desc" },
    });
  },

  async getSummary(apiKeyId: string, formId: string) {
    await assertFormOwnership(apiKeyId, formId);

    const [counts, submitEvents, submissions] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ["type"],
        where: { formId },
        _count: { type: true },
      }),
      // Fetched separately (rather than a JSON path filter) to keep the "was this SUBMIT
      // sent by the offline retry path" check as plain, provider-agnostic JS.
      prisma.analyticsEvent.findMany({
        where: { formId, type: "SUBMIT" },
        select: { metadata: true },
      }),
      prisma.formSubmission.findMany({
        where: { formId },
        select: { userAgent: true },
      }),
    ]);

    const views = counts.find((c) => c.type === "VIEW")?._count.type ?? 0;
    const starts = counts.find((c) => c.type === "START")?._count.type ?? 0;
    const submits = counts.find((c) => c.type === "SUBMIT")?._count.type ?? 0;
    const abandons = counts.find((c) => c.type === "ABANDON")?._count.type ?? 0;

    const offlineSubmissions = submitEvents.filter(
      (event) => (event.metadata as Record<string, unknown> | null)?.wasOffline === true
    ).length;

    const deviceCounts = new Map<DeviceType, number>();
    submissions.forEach((submission) => {
      const device = classifyDevice(submission.userAgent);
      deviceCounts.set(device, (deviceCounts.get(device) ?? 0) + 1);
    });

    return {
      byType: counts.map((c) => ({ type: c.type, count: c._count.type })),
      conversionRate: views > 0 ? Number((submits / views).toFixed(4)) : 0,
      completionRate: starts > 0 ? Number((submits / starts).toFixed(4)) : 0,
      abandonRate: starts > 0 ? Number((abandons / starts).toFixed(4)) : 0,
      offlineSubmissions,
      byDevice: Array.from(deviceCounts.entries()).map(([device, count]) => ({ device, count })),
    };
  },
};
