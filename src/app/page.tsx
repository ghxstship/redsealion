import Link from 'next/link';
import {
  features,
  useCases,
  testimonials,
  comparisonRows,
  comparisonData,
  faqs,
} from './_landing-data';
import { IconCheck, IconX, IconChevronDown } from '@/components/ui/Icons';


export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col font-[family-name:var(--font-inter)]">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 sm:px-8 lg:px-16">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
            <span className="text-xs font-bold text-white">FD</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-zinc-900">
            FlyteDeck
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/features"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
          >
            Features
          </Link>
          <span className="hidden text-sm font-medium text-zinc-500 sm:inline">
            Use Cases
          </span>
          <Link
            href="/pricing"
            className="hidden text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 sm:inline"
          >
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl">
              The operating system for experiential production
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-500">
              From pitch to wrap — build interactive proposals, manage clients,
              track budgets, schedule resources, and run your entire operation in
              one platform built for creative teams.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-lg bg-zinc-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
              >
                Start Free Trial
              </Link>
              <a
                href="#features"
                className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                See It In Action
              </a>
            </div>
            <p className="mt-8 text-sm text-zinc-400">
              Trusted by production teams managing brand activations, live
              events, and immersive experiences worldwide
            </p>
          </div>
        </section>

        {/* Logo Bar */}
        <section className="border-y border-zinc-100 px-6 py-12 sm:px-8 lg:px-16">
          <p className="mb-8 text-center text-xs font-medium uppercase tracking-wider text-zinc-400">
            Trusted by leading brands and agencies
          </p>
          <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-12 gap-y-6 sm:gap-x-16">
            {['Red Bull', 'Nike', 'Samsung', 'Spotify', 'Coca-Cola', 'Adobe'].map(
              (brand) => (
                <span
                  key={brand}
                  className="text-lg font-semibold tracking-wider text-zinc-300"
                >
                  {brand}
                </span>
              )
            )}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Everything your production company needs
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-500">
                Purpose-built tools for experiential agencies, event producers,
                and creative production teams.
              </p>
            </div>

            <div className="space-y-20 lg:space-y-28">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className={`grid items-center gap-12 lg:grid-cols-2 ${
                    feature.reverse ? 'lg:direction-rtl' : ''
                  }`}
                >
                  <div
                    className={`${feature.reverse ? 'lg:order-2' : 'lg:order-1'}`}
                  >
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {feature.category}
                    </span>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
                      {feature.headline}
                    </h3>
                    <p className="mt-4 leading-relaxed text-zinc-500">
                      {feature.description}
                    </p>
                    <ul className="mt-6 space-y-3">
                      {feature.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3">
                          <IconCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-zinc-700" strokeWidth={2} />
                          <span className="text-sm text-zinc-600">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`${feature.reverse ? 'lg:order-1' : 'lg:order-2'}`}
                  >
                    <div className="flex h-64 items-center justify-center rounded-xl bg-zinc-100 sm:h-80">
                      <span className="text-sm font-medium text-zinc-400">
                        {feature.visual}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="bg-zinc-50 px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Built for every type of experiential production
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase, index) => (
                <div
                  key={useCase.title}
                  className={`rounded-xl border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-300 ${
                    index >= 3 ? 'lg:col-span-1 lg:mx-auto lg:w-full' : ''
                  }`}
                  style={
                    index === 3
                      ? { gridColumn: 'auto' }
                      : undefined
                  }
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
                    <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={useCase.iconPath} />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    {useCase.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {useCase.description}
                  </p>
                  <Link
                    href={useCase.href}
                    className="mt-4 inline-block text-sm font-medium text-zinc-900 transition-colors hover:text-zinc-600"
                  >
                    Learn more &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                What production teams are saying
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.name}
                  className="rounded-xl border border-zinc-200 p-6"
                >
                  <p className="text-sm italic leading-relaxed text-zinc-600">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="mt-6">
                    <p className="text-sm font-semibold text-zinc-900">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {testimonial.title}, {testimonial.company}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="bg-zinc-50 px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Why teams switch to FlyteDeck
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="pb-4 text-left text-sm font-medium text-zinc-400">
                      Feature
                    </th>
                    <th className="pb-4 text-center text-sm font-semibold text-zinc-900">
                      <span className="rounded-lg bg-zinc-900 px-3 py-1 text-white">
                        FlyteDeck
                      </span>
                    </th>
                    <th className="pb-4 text-center text-sm font-medium text-zinc-400">
                      Spreadsheets & Email
                    </th>
                    <th className="pb-4 text-center text-sm font-medium text-zinc-400">
                      Generic PM Tools
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => {
                    const [flyteDeck, spreadsheets, generic] = comparisonData[row];
                    return (
                      <tr key={row} className="border-b border-zinc-100">
                        <td className="py-4 text-sm text-zinc-600">{row}</td>
                        <td className="py-4 text-center">
                          {flyteDeck ? (
                            <IconCheck className="mx-auto h-5 w-5 text-zinc-900" strokeWidth={2} />
                          ) : (
                            <IconX className="mx-auto h-5 w-5 text-zinc-300" strokeWidth={2} />
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {spreadsheets ? (
                            <IconCheck className="mx-auto h-5 w-5 text-zinc-400" strokeWidth={2} />
                          ) : (
                            <IconX className="mx-auto h-5 w-5 text-zinc-300" strokeWidth={2} />
                          )}
                        </td>
                        <td className="py-4 text-center">
                          {generic ? (
                            <IconCheck className="mx-auto h-5 w-5 text-zinc-400" strokeWidth={2} />
                          ) : (
                            <IconX className="mx-auto h-5 w-5 text-zinc-300" strokeWidth={2} />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                Frequently asked questions
              </h2>
            </div>

            <div className="divide-y divide-zinc-200">
              {faqs.map((faq) => (
                <details key={faq.question} className="group py-6" open>
                  <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-zinc-900">
                    {faq.question}
                    <IconChevronDown
                      className="h-5 w-5 flex-shrink-0 text-zinc-400 transition-transform group-open:rotate-180"
                      strokeWidth={1.5}
                    />
                  </summary>
                  <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-zinc-900 px-6 py-20 sm:px-8 sm:py-28 lg:px-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Ready to run your production company from one platform?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-400">
              Join the production teams already using FlyteDeck to win more work,
              deliver on budget, and grow profitably.
            </p>
            <div className="mt-10">
              <Link
                href="/signup"
                className="rounded-lg bg-white px-6 py-3 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100"
              >
                Start Free Trial
              </Link>
              <p className="mt-4 text-sm text-zinc-500">
                No credit card required
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-100 px-6 py-8 sm:px-8 lg:px-16">
        <div className="flex flex-col items-center justify-between gap-4 text-sm text-zinc-400 sm:flex-row">
          <span>&copy; {new Date().getFullYear()} FlyteDeck. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/features"
              className="transition-colors hover:text-zinc-600"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="transition-colors hover:text-zinc-600"
            >
              Pricing
            </Link>
            <Link
              href="/use-cases/brand-activations"
              className="transition-colors hover:text-zinc-600"
            >
              Use Cases
            </Link>
            <a href="#" className="transition-colors hover:text-zinc-600">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-zinc-600">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
