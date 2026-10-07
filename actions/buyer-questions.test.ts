import { describe, it, expect, vi, beforeEach } from "vitest";

// Exercised through the composed export, so withOrgAuth is part of what runs:
// only the tenant resolver and the repository are mocked.
vi.mock("@/lib/auth", () => ({ resolveAuthContext: vi.fn(), resolveTenantContext: vi.fn() }));
vi.mock("@clerk/nextjs/server", () => ({ auth: vi.fn() }));
vi.mock("@/lib/services/super-admin/auth", () => ({ requireSuperAdmin: vi.fn() }));

const repo = vi.hoisted(() => ({
  findBuyerQuestions: vi.fn(),
  countBuyerQuestionsByView: vi.fn(),
  answerBuyerQuestion: vi.fn(),
  setBuyerQuestionStatus: vi.fn(),
}));
vi.mock("@/lib/repositories/buyer-question", () => repo);

import { resolveTenantContext } from "@/lib/auth";
import type { TenantContext } from "@/lib/auth/context";
import {
  answerBuyerQuestion,
  getBuyerQuestions,
  setBuyerQuestionStatus,
} from "@/actions/buyer-questions";

const ctx = {
  userId: "user_clerk_123",
  user: { id: "db-user-1" },
  organization: { id: "org-1" },
  membership: { role: "MEMBER" },
} as unknown as TenantContext;

const ID = "3f1c2a52-6f0e-4d9b-9a3e-2f6a8f0c1d11";

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(resolveTenantContext).mockResolvedValue(ctx);
});

describe("buyer question actions", () => {
  it("lists the caller's own organization only, whatever the client sends", async () => {
    repo.findBuyerQuestions.mockResolvedValue({ questions: [], total: 45 });
    repo.countBuyerQuestionsByView.mockResolvedValue({ OPEN: 45, ANSWERED: 0, ALL_CARS: 0, DISMISSED: 0 });

    const response = await getBuyerQuestions({ view: "OPEN", page: 2, organizationId: "org-evil" });

    expect(repo.findBuyerQuestions).toHaveBeenCalledWith("org-1", "OPEN", 2, 20);
    expect(response).toMatchObject({
      success: true,
      data: { pagination: { page: 2, total: 45, totalPages: 3 } },
    });
  });

  it("records the answer against the database user, not the Clerk id", async () => {
    repo.answerBuyerQuestion.mockResolvedValue(1);
    await answerBuyerQuestion({ id: ID, answer: "  No accidents.  ", appliesToAllCars: false });
    expect(repo.answerBuyerQuestion).toHaveBeenCalledWith({
      organizationId: "org-1",
      id: ID,
      answer: "No accidents.",
      appliesToAllCars: false,
      answeredById: "db-user-1",
    });
  });

  it("reports another dealership's question as not found", async () => {
    repo.answerBuyerQuestion.mockResolvedValue(0);
    const response = await answerBuyerQuestion({ id: ID, answer: "x", appliesToAllCars: false });
    expect(response).toMatchObject({ success: false });
  });

  it("refuses an empty or over-long answer before writing", async () => {
    for (const answer of ["   ", "x".repeat(501)]) {
      const response = await answerBuyerQuestion({ id: ID, answer, appliesToAllCars: false });
      expect(response).toMatchObject({ success: false });
    }
    expect(repo.answerBuyerQuestion).not.toHaveBeenCalled();
  });

  it("only dismisses or reopens — ANSWERED is reachable by answering", async () => {
    repo.setBuyerQuestionStatus.mockResolvedValue(1);
    await setBuyerQuestionStatus({ id: ID, status: "DISMISSED" });
    expect(repo.setBuyerQuestionStatus).toHaveBeenCalledWith({
      organizationId: "org-1",
      id: ID,
      status: "DISMISSED",
    });
    const response = await setBuyerQuestionStatus({ id: ID, status: "ANSWERED" });
    expect(response).toMatchObject({ success: false });
  });
});
