
import React from 'react';
import { ModuleId } from './constants';

export interface Module {
    id: ModuleId;
    name: string;
    icon: React.ReactNode;
    component: React.FC;
}

export interface Theme {
    primary: string;
    accent: string;
    bg: string;
    card: string;
    text: string;
    textSecondary: string;
}

export interface Palette {
    name: string;
    colors: Omit<Theme, 'bg' | 'card' | 'text' | 'textSecondary'>;
}
