import React from 'react';

interface SectionTitleProps {
    children: React.ReactElement<{ className?: string }>;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => {
    return React.cloneElement(children, {
        className: (children.props.className ?? "") + " font-display text-3xl font-semibold leading-[1.12] tracking-[-0.03em] text-foreground sm:text-4xl lg:text-5xl"
    });
};

export default SectionTitle;
