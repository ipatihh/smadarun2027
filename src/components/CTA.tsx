import Link from "next/link";
import { ctaDetails } from "@/data/cta";

const CTA: React.FC = () => {
    return (
        <section id="cta" className="mt-10 mb-5 lg:my-20">
            <div className="relative h-full w-full z-10 mx-auto py-12 sm:py-20">
                <div className="h-full w-full">
                    {/* Panel diagonal — motif yang sama dengan panel countdown */}
                    <div className="rounded-panel overflow-hidden absolute inset-0 -z-10 h-full w-full bg-secondary" aria-hidden="true">
                        <div className="absolute inset-0 bg-secondary-accent [clip-path:polygon(0_0,38%_0,15%_100%,0_100%)]"></div>
                        <div className="absolute inset-0 bg-secondary-accent opacity-40 [clip-path:polygon(48%_0,58%_0,32%_100%,22%_100%)]"></div>
                    </div>

                    <div className="h-full flex flex-col items-center justify-center text-on-secondary text-center px-5">
                        <h2 className="reveal text-4xl sm:text-5xl md:text-6xl md:leading-tight font-bold mb-4 max-w-3xl">
                            {ctaDetails.heading}
                        </h2>

                        <p className="reveal reveal-1 mx-auto max-w-xl md:px-5 text-on-secondary-muted mb-8 leading-relaxed">
                            {ctaDetails.subheading}
                        </p>

                        <div className="reveal reveal-2 w-full max-w-sm mx-auto">
                            <Link
                                href="/daftar"
                                className="block w-full text-center bg-primary hover:bg-primary-accent text-on-primary font-bold py-4 px-8 rounded-full text-lg transition-all duration-300 hover:-translate-y-1 shadow-rest hover:shadow-hover active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-secondary"
                            >
                                Daftar SMADARUN 2027 Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
