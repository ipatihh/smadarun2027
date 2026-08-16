"use client"
import Image from "next/image";
import clsx from "clsx";
import { motion } from "framer-motion"

import BenefitBullet from "./BenefitBullet";
import SectionTitle from "../SectionTitle";
import { IBenefit } from "@/types";
import { revealContainer, revealChild } from "@/lib/motion";

interface Props {
    benefit: IBenefit;
    imageAtRight?: boolean;
}

const BenefitSection: React.FC<Props> = ({ benefit, imageAtRight }: Props) => {
    const { title, description, imageSrc, bullets } = benefit;

    return (
        <section className="benefit-section">
            <motion.div
                className="flex flex-wrap flex-col items-center justify-center gap-2 lg:flex-row lg:gap-20 lg:flex-nowrap mb-24"
                variants={revealContainer}
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true }}
            >
                <div
                    className={clsx("flex flex-wrap items-center w-full max-w-lg", { "justify-start": imageAtRight, "lg:order-1 justify-end": !imageAtRight })}
                    
                >
                    <div className="w-full  text-center lg:text-left ">
                        <motion.div
                            className="flex flex-col w-full"
                            variants={revealChild}
                        >
                            <SectionTitle>
                                <h3 className="lg:max-w-2xl">
                                    {title}
                                </h3>
                            </SectionTitle>

                            <p className="mt-1.5 mx-auto lg:ml-0 leading-normal text-foreground-accent">
                                {description}
                            </p>
                        </motion.div>

                        <div className="mx-auto lg:ml-0 w-full">
                            {bullets.map((item, index) => (
                                <BenefitBullet key={index} title={item.title} icon={item.icon} description={item.description} />
                            ))}
                        </div>
                    </div>
                </div>

                <div className={clsx("mt-5 lg:mt-0", { "lg:order-2": imageAtRight })}>
                    <div className={clsx("w-fit flex", { "justify-start": imageAtRight, "justify-end": !imageAtRight })}>
                        <Image src={imageSrc} alt="title" width={384} height={762} quality={100} className="lg:ml-0" />
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

export default BenefitSection