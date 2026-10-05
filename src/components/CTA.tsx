import Link from "next/link";
import { ctaDetails } from "@/data/cta";

const CTA: React.FC = () => {
    return (
        <section id="cta" className="my-12 lg:my-24">
            <div className="relative z-10 mx-auto w-full py-14 sm:py-20">
                <div className="h-full w-full">
                    <div className="rounded-panel overflow-hidden absolute inset-0 -z-10 h-full w-full bg-secondary" aria-hidden="true">
                        <div className="absolute -right-20 -top-32 h-80 w-80 rounded-full border border-primary/30"></div>
                        <div className="absolute -right-8 -top-20 h-56 w-56 rounded-full border border-primary/20"></div>
                    </div>

                    <div className="h-full flex flex-col items-center justify-center text-on-secondary text-center px-5">
                        <h2 className="reveal mb-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
                            {ctaDetails.heading}
                        </h2>

                        <p className="reveal reveal-1 mx-auto mb-8 max-w-xl px-5 text-sm leading-relaxed text-on-secondary-muted sm:text-base">
                            {ctaDetails.subheading}
                        </p>

                        <div className="reveal reveal-2 mx-auto">
                            <Link
                                href="/daftar"
                                className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-7 text-center text-sm font-semibold text-on-primary shadow-rest transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-accent hover:shadow-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                            >
                                Daftar sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
