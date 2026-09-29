"use client"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { BiMinus, BiPlus } from "react-icons/bi";

import SectionTitle from "./SectionTitle";
import { faqs } from "@/data/faq";

const FAQ: React.FC = () => {
    return (
        <section id="faq" className="py-10 lg:py-20">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-80 lg:shrink-0">
                    <SectionTitle>
                        <h2 className="mb-3 text-center lg:text-left">
                            Pertanyaan Populer
                        </h2>
                    </SectionTitle>
                    <p className="lg:mt-8 text-foreground-accent text-center lg:text-left">
                        Punya pertanyaan lain? Hubungi kami melalui:
                    </p>
                    <a
                        href="mailto:info@kembar.in"
                        className="mt-2 block text-xl font-semibold text-foreground underline-offset-4 hover:underline text-center lg:text-left break-all rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        info@kembar.in
                    </a>
                </div>

                <div className="w-full lg:max-w-2xl mx-auto border-b border-border">
                    {faqs.map((faq, index) => (
                        <Disclosure key={index} as="div" className="border-t border-border">
                            {({ open }) => (
                                <>
                                    <DisclosureButton className="flex items-center justify-between w-full gap-4 px-1 py-6 text-left group rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                        <span className="text-lg lg:text-xl font-semibold text-foreground group-hover:text-foreground-accent transition-colors duration-200">
                                            {faq.question}
                                        </span>
                                        {open ? (
                                            <BiMinus className="w-6 h-6 text-foreground-accent flex-shrink-0" aria-hidden="true" />
                                        ) : (
                                            <BiPlus className="w-6 h-6 text-foreground-accent flex-shrink-0" aria-hidden="true" />
                                        )}
                                    </DisclosureButton>
                                    <DisclosurePanel className="px-1 pb-6 -mt-2 text-foreground-accent text-base leading-relaxed">
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
