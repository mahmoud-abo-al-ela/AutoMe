"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const FinanceCalculator = ({
  open,
  setOpen,
  price,
  downPayment,
  setDownPayment,
  loanTerm,
  setLoanTerm,
  interestRate,
  setInterestRate,
}) => {
  // Handle down payment changes with validation
  const handleDownPaymentChange = (value) => {
    // Ensure down payment is not negative
    let newValue = Math.max(0, value);
    // Ensure down payment doesn't exceed vehicle price
    newValue = Math.min(newValue, price);
    setDownPayment(newValue);
  };

  // Handle input field change
  const handleInputChange = (e) => {
    const value = e.target.value === "" ? 0 : Number(e.target.value);
    handleDownPaymentChange(value);
  };

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
  const totalInterest = monthlyPayment * loanTerm - principal;
  const totalCost = principal + totalInterest;

  // Calculate down payment percentage
  const downPaymentPercentage =
    price > 0 ? Math.round((downPayment / price) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-center sm:text-left text-lg sm:text-xl">
            Finance Calculator
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
          <div className="grid gap-1 sm:gap-2">
            <Label htmlFor="price" className="text-xs sm:text-sm">
              Vehicle Price
            </Label>
            <Input
              id="price"
              value={`$${price.toLocaleString()}`}
              disabled
              className="text-sm h-8 sm:h-10"
            />
          </div>
          <div className="grid gap-1 sm:gap-2">
            <div className="flex justify-between">
              <Label htmlFor="downPayment" className="text-xs sm:text-sm">
                Down Payment ({downPaymentPercentage}%)
              </Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                ${downPayment.toLocaleString()}
              </span>
            </div>
            <Input
              id="downPayment"
              type="number"
              value={downPayment}
              onChange={handleInputChange}
              min={0}
              max={price}
              className="text-sm h-8 sm:h-10"
            />
            <Slider
              value={[downPayment]}
              max={price}
              step={500}
              onValueChange={(value) => handleDownPaymentChange(value[0])}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>$0</span>
              <span>${price.toLocaleString()}</span>
            </div>
          </div>
          <div className="grid gap-1 sm:gap-2">
            <div className="flex justify-between">
              <Label htmlFor="term" className="text-xs sm:text-sm">
                Loan Term (months)
              </Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {loanTerm} months
              </span>
            </div>
            <Slider
              id="term"
              value={[loanTerm]}
              min={12}
              max={84}
              step={12}
              onValueChange={(value) => setLoanTerm(value[0])}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>12 mo</span>
              <span>84 mo</span>
            </div>
          </div>
          <div className="grid gap-1 sm:gap-2">
            <div className="flex justify-between">
              <Label htmlFor="rate" className="text-xs sm:text-sm">
                Interest Rate (%)
              </Label>
              <span className="text-xs sm:text-sm text-muted-foreground">
                {interestRate}%
              </span>
            </div>
            <Slider
              id="rate"
              value={[interestRate]}
              min={0}
              max={15}
              step={0.1}
              onValueChange={(value) => setInterestRate(value[0])}
              className="py-1"
            />
            <div className="flex justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
          <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-muted rounded-lg">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Monthly Payment
                </div>
                <div className="font-bold text-base sm:text-lg">
                  ${Math.round(monthlyPayment).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Loan Amount
                </div>
                <div className="font-bold text-sm sm:text-base">
                  ${principal.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Interest
                </div>
                <div className="font-bold text-sm sm:text-base">
                  ${Math.round(totalInterest).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Total Cost
                </div>
                <div className="font-bold text-sm sm:text-base">
                  ${Math.round(totalCost).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinanceCalculator;
