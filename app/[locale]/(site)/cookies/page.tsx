export const metadata = {
  title: "Cookie Policy | AutoMe",
  description: "Cookie Policy for AutoMe platform",
};

export default function CookiePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
      <div className="prose prose-blue max-w-none">
        <p className="text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-2xl font-semibold mt-8 mb-4">1. What are cookies?</h2>
        <p>
          Cookies are small text files that are placed on your computer or mobile device when you visit a website. 
          They are widely used to make websites work more efficiently and provide information to the owners of the site.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How we use cookies</h2>
        <p>
          We use cookies to:
        </p>
        <ul className="list-disc ps-6 space-y-2">
          <li>Remember your preferences and settings</li>
          <li>Understand how you use our platform</li>
          <li>Improve your user experience</li>
          <li>Maintain security and authentication</li>
        </ul>
      </div>
    </div>
  );
}
