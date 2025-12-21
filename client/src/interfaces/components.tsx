import { LucideIcon } from "lucide-react";

export interface LogoProps {
    size: string;
    showText?: boolean;
}
export interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    index: number;
}

export interface sizeClassesProps {
    sm: string;
    md: string;
    lg: string;
}
export interface textSizeClassesProps {
    sm: string;
    md: string;
    lg: string;
}