import React from 'react';

interface SpinnerProps {
    size?: 'small' | 'medium' | 'large' | number;
    color?: string;
    thickness?: number;
    className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
    size = 'medium',
    color = '#000000',
    thickness = 2,
    className = ''
}) => {
    let sizeInPx: number;
    if (typeof size === 'number') {
        sizeInPx = size;
    } else {
        switch (size) {
            case 'small':
                sizeInPx = 16;
                break;
            case 'large':
                sizeInPx = 48;
                break;
            case 'medium':
            default:
                sizeInPx = 32;
                break;
        }
    }

    let sizeClass: string;
    if (sizeInPx <= 16) {
        sizeClass = 'w-4 h-4';
    } else if (sizeInPx <= 24) {
        sizeClass = 'w-6 h-6';
    } else if (sizeInPx <= 32) {
        sizeClass = 'w-8 h-8';
    } else if (sizeInPx <= 48) {
        sizeClass = 'w-12 h-12';
    } else {
        sizeClass = 'w-16 h-16';
    }

    const thicknessClass = thickness <= 2 ? 'border-2' : 'border-4';

    return (
        <div className={`inline-block relative ${sizeClass} ${className}`}>
            <div
                className={`absolute ${sizeClass} ${thicknessClass} rounded-full animate-spin duration-500`}
                style={{
                    borderColor: `${color} ${color} transparent transparent`,
                }}
            />
        </div>
    );
};