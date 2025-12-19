import { LucideIcon } from "lucide-react";

export interface LogoProps {
    showText?: boolean;
}
export interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    index: number;
}