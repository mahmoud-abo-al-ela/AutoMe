export const metadata = {
  title: "Privacy Policy | AutoMe",
  description: "Privacy Policy for AutoMe platform",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as when you create or modify your account,
          request on-demand services, contact customer support, or otherwise communicate with us.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Information</h2>
        <p>
          We may use the information we collect about you to:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Provide, maintain, and improve our Services</li>
          <li>Process transactions and send related information</li>
          <li>Send administrative messages, customer service responses, and technical notices</li>
          <li>Communicate with you about products, services, offers, and events</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Information Sharing</h2>
        <p>
          We may share the information we collect about you with third parties such as our
          partners and service providers who need access to such information to carry out work on our behalf.
        </p>
      </div>
    </div>
  );
}
