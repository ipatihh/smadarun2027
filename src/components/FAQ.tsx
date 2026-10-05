"use client"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { BiMinus, BiPlus } from "react-icons/bi";

import SectionTitle from "./SectionTitle";
import { faqs } from "@/data/faq";

const FAQ: React.FC = () => {
    return (
        <section id="faq" className="py-16 lg:py-24">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="reveal-left lg:w-80 lg:shrink-0">
                    <SectionTitle>
                        <h2 className="mb-3 text-center lg:text-left">
                            Pertanyaan Populer
                        </h2>
                    </SectionTitle>
                    <p className="text-center text-sm leading-relaxed text-foreground-accent lg:mt-6 lg:text-left">
                        Punya pertanyaan lain? Hubungi kami melalui:
                    </p>
                    <a
                        href="mailto:info@kembar.in"
                        className="mt-2 block break-all rounded text-center text-sm font-semibold text-foreground underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:text-left"
                    >
                        info@kembar.in
                    </a>
                </div>

                <div className="reveal-right w-full lg:max-w-2xl mx-auto border-b border-border">
                    {faqs.map((faq, index) => (
                        <Disclosure key={index} as="div" className="border-t border-border">
                            {({ open }) => (
                                <>
                                    <DisclosureButton className="group flex w-full items-center justify-between gap-4 rounded px-1 py-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                                        <span className="text-sm font-semibold leading-relaxed text-foreground transition-colors duration-200 group-hover:text-foreground-accent sm:text-base">
                                            {faq.question}
                                        </span>
                                        {open ? (
                                            <BiMinus className="w-6 h-6 text-foreground-accent flex-shrink-0" aria-hidden="true" />
                                        ) : (
                                            <BiPlus className="w-6 h-6 text-foreground-accent flex-shrink-0" aria-hidden="true" />
                                        )}
                                    </DisclosureButton>
                                    <DisclosurePanel className="-mt-1 px-1 pb-6 text-sm leading-relaxed text-foreground-accent sm:text-base">
                                        {faq.answer}
                                    </DisclosurePanel>
                                </>
                            )}
                        </Disclosure>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
