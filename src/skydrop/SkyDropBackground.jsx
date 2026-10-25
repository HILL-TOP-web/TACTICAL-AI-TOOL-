'use strict';

import React from 'react';
import './skydrop-background.css';

export default function SkyDropBackground({
    children,
    className = ''
}) {
    return (
        <div className={`skydrop-app ${className}`.trim()}>
            {children}
        </div>
    );
}
