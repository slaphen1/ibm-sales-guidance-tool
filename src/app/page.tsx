import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="border-b border-ibm-gray-20 pb-8">
        <h1 className="text-2xl font-semibold text-ibm-gray-100 mb-2">
          IBM Sales Guidance Tool
        </h1>
        <p className="text-sm text-gray-500 max-w-xl">
          AI-powered guidance for IBM sellers. Get deal recommendations, talk
          tracks, and competitive intelligence — powered by IBM AskSales and
          WatsonX.
        </p>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FeatureCard
          title="Deal Guidance"
          description="Enter your deal details and get AI-recommended next steps, talk tracks, and playbooks tailored to your product, industry, and deal stage."
          href="/guidance"
          cta="Get Deal Guidance"
        />
        <FeatureCard
          title="AI Assistant"
          description="Chat with the IBM AskSales AI assistant. Ask about objections, competitive positioning, product capabilities, and sales strategy."
          href="/chat"
          cta="Open AI Assistant"
        />
      </section>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="border border-ibm-gray-20 p-6 flex flex-col gap-4">
      <h2 className="text-base font-semibold text-ibm-gray-100">{title}</h2>
      <p className="text-sm text-gray-500 flex-1">{description}</p>
      <Link
        href={href}
        className="inline-block text-sm text-ibm-blue border border-ibm-blue px-4 py-2 text-center hover:bg-ibm-blue hover:text-white transition-colors"
      >
        {cta} →
      </Link>
    </div>
  );
}
