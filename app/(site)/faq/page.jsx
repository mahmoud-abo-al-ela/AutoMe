import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { faqConfig } from "@/lib/FaqConfig";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FAQ() {
  return (
    <div className="container py-12 max-w-4xl mx-auto mt-12">
      <h1 className="text-4xl font-bold text-center mb-2">
        Frequently Asked Questions
      </h1>
      <p className="text-center text-muted-foreground mb-8">
        Find answers to common questions about DriveAI and our services
      </p>

      <div className="space-y-10">
        {faqConfig.map((category, index) => (
          <div key={index} className="border rounded-lg p-6 bg-card shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">{category.category}</h2>
            <Accordion type="single" collapsible className="w-full">
              {category.questions.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="text-left cursor-pointer">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="text-muted-foreground">{item.answer}</div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {/* Contact support section */}
      <div className="mt-16 bg-[#F1F0FB] rounded-lg p-8 text-center">
        <h3 className="text-2xl font-semibold mb-3">Still have questions?</h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          If you couldn't find the answer you were looking for, our support team
          is here to help with any questions you might have.
        </p>
        <Button size="lg">
          <Link href="#">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
