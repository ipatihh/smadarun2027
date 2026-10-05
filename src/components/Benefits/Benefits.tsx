import SectionTitle from "../SectionTitle";
import { benefits, benefitsIntro } from "@/data/benefits";

/**
 * Satu grid ringkas, menggantikan tiga blok zig-zag (foto + tiga butir) sebelumnya. Blok
 * zig-zag itu pola template paling kentara di halaman ini, dan di ponsel tiga foto
 * portrait-nya saja sudah memakan lebih dari dua layar.
 */
const Benefits: React.FC = () => {
    return (
        <section id="fasilitas" aria-labelledby="fasilitas-judul" className="py-20 lg:py-28">
            <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
                <div className="reveal-left">
                    <SectionTitle>
                        <h2 id="fasilitas-judul" className="max-w-md">{benefitsIntro.title}</h2>
                    </SectionTitle>
                </div>
                <p className="reveal-right max-w-md text-sm leading-relaxed text-foreground-accent sm:text-base lg:justify-self-end">
                    {benefitsIntro.description}
                </p>
            </div>

            <ul className="mt-12 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
                {benefits.map((item) => (
                    <li key={item.title} className="rounded-card border border-border bg-card/80 p-6 transition-colors hover:bg-card">
                        <span
                            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-sunken text-foreground"
                            aria-hidden="true"
                        >
                            {item.icon}
                        </span>
                        <h3 className="mt-6 text-base font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-foreground-accent">{item.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Benefits;
