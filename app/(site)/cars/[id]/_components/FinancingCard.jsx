"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calculator } from "lucide-react";
import FinanceCalculator from "./FinanceCalculator";

const FinancingCard = ({ price }) => {
  const [open, setOpen] = useState(false);
  const [downPayment, setDownPayment] = useState(Math.round(price * 0.2));
  const [loanTerm, setLoanTerm] = useState(60);
  const [interestRate, setInterestRate] = useState(5);

  // Reset down payment if price changes
  useEffect(() => {
    setDownPayment(Math.round(price * 0.2));
  }, [price]);

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal, rate, months) => {
    // If principal is 0 or negative, return 0
    if (principal <= 0) return 0;

    const monthlyRate = rate / 100 / 12;
    // If interest rate is 0, simple division
    if (rate === 0) return principal / months;

    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  };

  // Calculate loan details
  const principal = Math.max(0, price - downPayment);
  const monthlyPayment = calculateMonthlyPayment(
    principal,
    interestRate,
    loanTerm
  );

  // Calculate down payment percentage
  const downPaymentPercentage =
    price > 0 ? Math.round((downPayment / price) * 100) : 0;

  return (
    <>
      <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg">
              <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h3 className="font-bold text-base sm:text-lg">
              Financing Options
            </h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white/10 backdrop-blur-sm p-3 sm:p-4 rounded-lg sm:rounded-xl">
              <div className="text-xs sm:text-sm opacity-90">
                Estimated Monthly Payment
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold">
                ${Math.round(monthlyPayment)}/mo
              </div>
              <div className="text-[10px] sm:text-xs opacity-75">
                Based on {interestRate}% APR, {loanTerm} months,{" "}
                {downPaymentPercentage}% down
              </div>
            </div>
            <Button
              variant="secondary"
              className="w-full bg-white text-gray-900 hover:bg-gray-100 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold cursor-pointer hover:scale-105 transition-transform py-2 sm:py-3"
              onClick={() => setOpen(true)}
            >
              <Calculator className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Calculate Finance Options
            </Button>
          </div>
        </CardContent>
      </Card>

      <FinanceCalculator
        open={open}
        setOpen={setOpen}
        price={price}
        downPayment={downPayment}
        setDownPayment={setDownPayment}
        loanTerm={loanTerm}
        setLoanTerm={setLoanTerm}
        interestRate={interestRate}
        setInterestRate={setInterestRate}
      />
    </>
  );
};

export default FinancingCard;
