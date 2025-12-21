import { LucideIcon } from "lucide-react";

export type LogoSize = "sm" | "md" | "lg";
export interface LogoProps {
    size: LogoSize;
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