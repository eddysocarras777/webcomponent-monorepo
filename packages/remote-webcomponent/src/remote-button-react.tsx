import React from 'react';

type RemoteButtonReactProps = Readonly<{
    label?: string;
    color?: string;
    onClick?: () => void;
}>;

export function RemoteButtonReact({
    label = 'Remote Button ReactJs',
    color = '#1976d2',
    onClick,
}: RemoteButtonReactProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            style={{
                background: color,
                color: 'white',
                padding: '8px 12px',
                fontSize: 14,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
            }}
        >
            {label}
        </button>
    );

}