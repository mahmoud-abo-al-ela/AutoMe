export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for AutoMe platform",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Acceptance of Terms</h2>
        <p>
          By accessing and using AutoMe, you accept and agree to be bound by the terms
          and provision of this agreement.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. Description of Service</h2>
        <p>
          AutoMe provides a platform for car dealerships to manage inventory, test drives,
          and customer interactions. We reserve the right to modify or discontinue,
          temporarily or permanently, the Service with or without notice.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. User Conduct</h2>
        <p>
          You agree to use the Service only for lawful purposes. You agree not to take
          any action that might compromise the security of the site, render the site
          inaccessible to others or otherwise cause damage to the site or the Content.
        </p>
      </div>
    </div>
  );
}
