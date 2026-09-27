"use client";

import { BuyerQuestionsPresenter } from "./_components/BuyerQuestionsPresenter";
import { useBuyerQuestions } from "@/hooks/use-buyer-questions";

const BuyerQuestionsPage = () => {
  const pageData = useBuyerQuestions();

  return <BuyerQuestionsPresenter {...pageData} />;
};

export default BuyerQuestionsPage;
