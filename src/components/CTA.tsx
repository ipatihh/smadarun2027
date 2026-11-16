import Link from "next/link";
import { ctaDetails } from "@/data/cta";
import PolaTitik from "@/components/PolaTitik";
import { getLiveEventData } from "@/lib/kembarinEvents";

async function CTA() {
    const live = await getLiveEventData();
    return (
        <section id="cta" className="my-12 lg:my-24">
            <div className="relative z-10 mx-auto w-full py-14 sm:py-20">
                <div className="h-full w-full">
                    <div className="rounded-panel overflow-hidden absolute inset-0 -z-10 h-full w-full panel-jersey" aria-hidden="true">
                        <PolaTitik className="absolute -right-40 -top-40 h-[26rem] w-[26rem] opacity-70 sm:-right-24 sm:h-[34rem] sm:w-[34rem]" />
                        <PolaTitik className="absolute -bottom-48 -left-48 hidden h-[26rem] w-[26rem] opacity-40 sm:block" />
                    </div>

                    <div className="h-full flex flex-col items-center justify-center text-on-secondary text-center px-5">
                        <h2 className="reveal mb-4 max-w-3xl font-display text-4xl font-medium leading-[1.1] tracking-[-0.02em] sm:text-5xl md:text-6xl">
                            {ctaDetails.heading}
                        </h2>

                        <p className="reveal reveal-1 mx-auto mb-8 max-w-xl px-5 text-sm leading-relaxed text-on-secondary-muted sm:text-base">
                            {ctaDetails.subheading}
                        </p>

                        <div className="reveal reveal-2 mx-auto">
                            {live.comingSoon ? (
                                <span className="inline-flex min-h-11 cursor-default items-center justify-center rounded-full bg-surface-sunken px-7 text-center text-sm font-semibold text-muted-foreground">
                                    Coming Soon
                                </span>
                            ) : (
                            <Link
                                href="/daftar"
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-7 text-center text-sm font-semibold text-on-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                            >
                                Daftar sekarang
                            </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default CTA;
