"use client"
import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { BiMinus, BiPlus } from "react-icons/bi";

import SectionTitle from "./SectionTitle";
import { faqs } from "@/data/faq";

const FAQ: React.FC = () => {
    return (
        <section id="faq" className="py-10 lg:py-20">
            <div className="flex flex-col lg:flex-row gap-10">
                <div className="">
                    <p className="hidden lg:block text-foreground-accent font-semibold tracking-wide">FAQ</p>
                    <SectionTitle>
                        {/* Judul diubah ke Bahasa Indonesia agar serasi dengan isi pertanyaannya */}
                        <h2 className="my-3 !leading-snug lg:max-w-sm text-center lg:text-left text-3xl lg:text-4xl font-bold">
                            Pertanyaan Populer
                        </h2>
                    </SectionTitle>
                    <p className="lg:mt-10 text-foreground-accent text-center lg:text-left">
                        Punya pertanyaan lain? Hubungi kami melalui:
                    </p>
                    {/* Email diubah ke info@kembar.in sesuai permintaan */}
                    <a 
                        href="mailto:info@kembar.in" 
                        className="mt-3 block text-xl lg:text-3xl text-secondary font-semibold hover:underline text-center lg:text-left break-all"
                    >
                        info@kembar.in
                    </a>
                </div>

                <div className="w-full lg:max-w-2xl mx-auto border-b">
                    {faqs.map((faq, index) => (
                        <div key={index} className="mb-7">
                            <Disclosure>
                                {({ open }) => (
                                    <>
                                        <DisclosureButton className="flex items-center justify-between w-full px-4 pt-7 text-lg text-left border-t group">
                                            <span className="text-xl lg:text-2xl font-semibold text-foreground group-hover:text-secondary transition-colors duration-200">
                                                {faq.question}
                                            </span>
                                            {open ? (
                                                <BiMinus className="w-6 h-6 text-secondary flex-shrink-0 ml-4" />
                                            ) : (
                                                <BiPlus className="w-6 h-6 text-secondary flex-shrink-0 ml-4" />
                                            )}
                                        </DisclosureButton>
                                        <DisclosurePanel className="px-4 pt-4 pb-2 text-foreground-accent text-base leading-relaxed">
                                            {faq.answer}
                                        </DisclosurePanel>
                                    </>
                                )}
                            </Disclosure>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;