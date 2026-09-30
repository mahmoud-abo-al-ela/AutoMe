"use client";

import { MessageCircleQuestion } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { Pagination } from "@/components/common/Pagination";
import { useFormatters } from "@/hooks/use-formatters";
import type { BuyerQuestionTab, useBuyerQuestions } from "@/hooks/use-buyer-questions";
import { QuestionCard } from "./QuestionCard";

export type BuyerQuestionsPresenterProps = ReturnType<typeof useBuyerQuestions>;
export type InboxQuestion = BuyerQuestionsPresenterProps["questions"][number];

const TABS: BuyerQuestionTab[] = ["OPEN", "ANSWERED", "DISMISSED"];

export const BuyerQuestionsPresenter = ({
  status,
  questions,
  counts,
  pagination,
  isLoading,
  isError,
  pendingId,
  handlers,
}: BuyerQuestionsPresenterProps) => {
  const t = useTranslations("org.buyerQuestions");
  const fmt = useFormatters();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>{t(`tabs.${status}`)}</CardTitle>
            <CardDescription>{t(`tabHints.${status}`)}</CardDescription>
          </div>
          <Tabs value={status} onValueChange={(value) => handlers.selectTab(value as BuyerQuestionTab)}>
            <TabsList>
              {TABS.map((tab) => (
                <TabsTrigger key={tab} value={tab} className="gap-2 cursor-pointer">
                  {t(`tabs.${tab}`)}
                  <Badge variant={tab === "OPEN" && counts.OPEN > 0 ? "default" : "secondary"} className="tabular-nums">
                    {fmt.number(counts[tab])}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-32 w-full rounded-lg" />)
          ) : isError ? (
            <p className="text-sm text-destructive">{t("loadFailed")}</p>
          ) : questions.length === 0 ? (
            <EmptyState
              variant="inline"
              icon={MessageCircleQuestion}
              title={t(`empty.${status}.title`)}
              description={t(`empty.${status}.description`)}
            />
          ) : (
            questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                isPending={pendingId === question.id}
                onAnswer={handlers.answer}
                onDismiss={handlers.dismiss}
                onReopen={handlers.reopen}
              />
            ))
          )}
        </CardContent>

        {pagination.totalPages > 1 && (
          <CardFooter className="px-3 sm:px-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlers.setPage}
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
};
