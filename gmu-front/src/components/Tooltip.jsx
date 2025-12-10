import { useState } from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
    const [isVisible, setIsVisible] = useState(false);

    const positions = {
        top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };

    const arrowPositions = {
        top: 'top-full left-1/2 -translate-x-1/2 -mt-1',
        bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-180',
        left: 'left-full top-1/2 -translate-y-1/2 -ml-1 -rotate-90',
        right: 'right-full top-1/2 -translate-y-1/2 -mr-1 rotate-90'
    };

    if (!content) return children;

    return (
        <div className="relative inline-block">
            <div
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
                onFocus={() => setIsVisible(true)}
                onBlur={() => setIsVisible(false)}
            >
                {children}
            </div>
            {isVisible && (
                <div className={`absolute z-50 ${positions[position]} animate-fade-in`}>
                    <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-xs whitespace-nowrap">
                        {content}
                        <div className={`absolute w-0 h-0 ${arrowPositions[position]}`}>
                            <div className="border-4 border-transparent border-t-slate-900"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tooltip;
