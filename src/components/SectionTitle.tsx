import React from 'react';

interface SectionTitleProps {
    children: React.ReactElement<{ className?: string }>;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children }) => {
    return React.cloneElement(children, {
        className: (children.props.className ?? "") + " text-2xl sm:text-3xl lg:text-4xl lg:leading-tight font-semibold tracking-tight"
    });
};

export default SectionTitle;
