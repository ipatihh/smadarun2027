import SectionTitle from "../SectionTitle";
import Eyebrow from "../Eyebrow";
import { benefits, benefitsIntro } from "@/data/benefits";

/**
 * Satu grid ringkas, menggantikan tiga blok zig-zag (foto + tiga butir) sebelumnya. Blok
 * zig-zag itu pola template paling kentara di halaman ini, dan di ponsel tiga foto
 * portrait-nya saja sudah memakan lebih dari dua layar.
 */
const Benefits: React.FC = () => {
    return (
        <section id="fasilitas" aria-labelledby="fasilitas-judul" className="py-20 lg:py-32">
            <div className="grid gap-4 lg:grid-cols-2 lg:items-end lg:gap-16">
                <div className="reveal-left">
                    <Eyebrow>Fasilitas</Eyebrow>
                    <SectionTitle>
                        <h2 id="fasilitas-judul" className="max-w-md">{benefitsIntro.title}</h2>
                    </SectionTitle>
                </div>
                <p className="reveal-right max-w-md text-sm leading-relaxed text-foreground-accent sm:text-base lg:justify-self-end">
                    {benefitsIntro.description}
                </p>
            </div>

            <ul className="mt-14 grid gap-x-12 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                {benefits.map((item, index) => (
                    <li key={item.title} className="border-t border-border-strong/60 pt-6">
                        <div className="flex items-center justify-between text-foreground-accent">
                            <span className="font-display text-sm " aria-hidden="true">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <span aria-hidden="true">{item.icon}</span>
                        </div>
                        <h3 className="mt-6 font-display text-xl font-medium text-foreground">{item.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-foreground-accent">{item.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Benefits;
