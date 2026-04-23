"use server";

import VoiceSession from "@/database/models/voiceSession.model";
import { connectToDatabase } from "@/database/mongoose";
import { EndSessionResult, StartSessionResult } from "@/types";
import {
  getCurrentBillingPeriodStart,
  PLAN_LIMITS,
} from "../subscription-constants";
import { getUserPlan } from "../subscription.server";

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    await connectToDatabase();

    const plan = await getUserPlan();
    const limits = PLAN_LIMITS[plan];
    const billingPeriodStart = getCurrentBillingPeriodStart();

    const sessionCount = await VoiceSession.countDocuments({
      clerkId,
      billingPeriodStart,
    });

    if (sessionCount >= limits.maxSessionsPerMonth) {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");

      return {
        success: false,
        error: `You have reached the monthly session limit for your ${plan} plan (${limits.maxSessionsPerMonth}). Please upgrade for more sessions.`,
        isBillingError: true,
      };
    }

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
    };
  } catch (error) {
    console.error("Error starting voice session:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء بدء الجلسة الصوتية. حاول مرة أخرى.",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number,
): Promise<EndSessionResult> => {
  try {
    await connectToDatabase();

    const result = await VoiceSession.findByIdAndUpdate(sessionId, {
      endedAt: new Date(),
      durationSeconds,
    });

    if (!result)
      return {
        success: false,
        error: "الجلسة غير موجودة.",
      };

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error ending voice session:", error);
    return {
      success: false,
      error: "حدث خطأ أثناء إنهاء الجلسة الصوتية. حاول مرة أخرى.",
    };
  }
};
