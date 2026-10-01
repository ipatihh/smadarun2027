import SectionTitle from "../SectionTitle";
import { benefits, benefitsIntro } from "@/data/benefits";

/**
 * Satu grid ringkas, menggantikan tiga blok zig-zag (foto + tiga butir) sebelumnya. Blok
 * zig-zag itu pola template paling kentara di halaman ini, dan di ponsel tiga foto
 * portrait-nya saja sudah memakan lebih dari dua layar.
 */
const Benefits: React.FC = () => {
    return (
        <section id="fasilitas" aria-labelledby="fasilitas-judul" className="py-16 lg:py-24">
            <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
                <div className="reveal-left">
                    <SectionTitle>
                        <h2 id="fasilitas-judul" className="max-w-md">{benefitsIntro.title}</h2>
                    </SectionTitle>
                </div>
                <p className="reveal-right max-w-md text-foreground-accent lg:justify-self-end">
                    {benefitsIntro.description}
                </p>
            </div>

            <ul className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {benefits.map((item) => (
                    <li key={item.title} className="border-t border-border pt-6">
                        <span
                            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-on-primary"
                            aria-hidden="true"
                        >
                            {item.icon}
                        </span>
                        <h3 className="mt-5 text-xl font-semibold text-foreground">{item.title}</h3>
                        <p className="mt-2 text-base leading-relaxed text-foreground-accent">{item.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Benefits;
