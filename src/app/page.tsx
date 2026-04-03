export default function HomePage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto space-y-16">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">OpenFlag</h1>
          <p className="text-lg text-gray-300">Know what you agree to.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Manifesto</h2>

          <p className="text-gray-300">nobody reads privacy policy.</p>

          <p className="text-gray-300">
            its long, confusing and made like that on purpose.
          </p>

          <p className="text-gray-300">we just click “i agree” and move on.</p>

          <p className="text-gray-300">openflag try to fix that.</p>

          <p className="text-gray-300">
            it take policies and break into simple things: what they collect,
            what they do, and what you should care.
          </p>

          <p className="text-gray-300">not legal advice, just clarity.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Current Status</h2>

          <ul className="text-gray-300 space-y-2">
            <li>• worker pipeline working</li>
            <li>• ai extraction + analysis done</li>
            <li>• database + queue system stable</li>
            <li>• basic frontend started</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Roadmap</h2>

          <ul className="text-gray-300 space-y-2">
            <li>• search and explore softwares</li>
            <li>• software detail page (flags, summary)</li>
            <li>• comparison between apps</li>
            <li>• open source alternatives</li>
            <li>• opt-out email generator</li>
            <li>• ai chat for policy questions</li>
          </ul>
        </section>

        <section className="pt-10 border-t border-neutral-900 text-sm text-gray-500">
          <p>openflag.xyz</p>
        </section>
      </div>
    </main>
  );
}
