import {
  BarChart3,
  Shield,
  Zap,
  Webhook,
  CreditCard,
  Handshake,
  Globe,
  Clock,
  ScanBarcode,
  Edit3,
  Barcode,
  LinkIcon,
  ExternalLink,
  ScanLine,
  QrCode,
  Link2,
  Sparkles,
  Crown,
  LayoutDashboard,
  Settings,
} from "lucide-react";

export const heroContent = [
  { value: "10+", label: "Powerful Tools" },
  { value: "20", label: "Free Credits" },
  { value: "99.9%", label: "Uptime" },
];

export const navItems = [
  {
    label: "Features",
    href: "#features",
  },
  {
    label: "Pricing",
    href: "#pricing",
  },
  {
    label: "Tools",
    href: "#tools",
  },
];

export const featureCards = [
  {
    Icon: Zap,
    title: "Lightning Fast",
    description:
      "Generate codes and shorten links in milliseconds with our optimized infrastructure",
  },
  {
    Icon: Shield,
    title: "Secure by Default",
    description:
      "All data encrypted, with optional password protection and one-time links",
  },
  {
    Icon: BarChart3,
    title: "Rich Analytics",
    description:
      "Track clicks, scans, and usage with detailed reports and insights",
  },
  {
    Icon: Webhook,
    title: "One Platform",
    description:
      "A centralized infrastructure for URL shortening, QR and many more to scale.",
  },
  {
    Icon: CreditCard,
    title: "Flexible Credit System",
    description:
      "Buy credits only when you need them. No forced subscriptions, no wasted spend",
  },
  {
    Icon: Handshake,
    title: "Unified Experience",
    description:
      "One dashboard, consistent behavior, and predictable workflows across all tools",
  },
];

export const tools = [
  {
    icon: Link2,
    title: "URL Shortener",
    description:
      "Create short, memorable links that redirect to any URL. Track clicks and engagement.",
  },
  {
    icon: QrCode,
    title: "QR Code Generator",
    description:
      "Generate customizable QR codes for websites, text, contacts, and more.",
  },
  {
    icon: ScanLine,
    title: "QR Code Scanner",
    description:
      "Instantly scan and decode QR codes from images or your camera.",
  },
  {
    icon: ExternalLink,
    title: "Link Expander",
    description:
      "Reveal the original destination of shortened URLs before clicking.",
  },
  {
    icon: LinkIcon,
    title: "Broken Link Checker",
    description: "Detect and report broken links on any website or webpage.",
  },
  {
    icon: Barcode,
    title: "Barcode Generator",
    description:
      "Create various barcode formats including UPC, EAN, Code 128, and more.",
  },
  {
    icon: Edit3,
    title: "Dynamic QR Generator",
    description: "Edit QR code destinations anytime without reprinting codes.",
  },
  {
    icon: ScanBarcode,
    title: "Barcode Decoder",
    description: "Scan and decode any barcode format from images or camera.",
  },
  {
    icon: Globe,
    title: "DNS & Domain Checker",
    description: "Look up DNS records, WHOIS data, and domain availability.",
  },
  {
    icon: Clock,
    title: "One-Time Links",
    description:
      "Create secure links that expire after a single use or set time.",
  },
];

export const title = [
  "URL Shortener",
  "QR Code Generator",
  "QR Code Scanner",
  "Link Expander",
  "Broken Link Checker",
  "Barcode Generator",
  "Dynamic QR Generator",
  "Barcode Decoder",
  "DNS & Domain Checker",
  "One-Time Links",
];

export const plans = [
  {
    name: "Free",
    description: "Perfect for getting started",
    price: "$0",
    period: "/forever",
    credits: 100,
    icon: Zap,
    features: [
      "20 credits on signup",
      "Basic URL shortening",
      "Standard QR codes",
      "Link expander access",
      "Basic analytics",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    description: "For power users and small teams",
    price: "$9.99",
    period: "/month",
    credits: 500,
    icon: Sparkles,
    features: [
      "500 credits per month",
      "Custom short URLs",
      "Dynamic QR codes",
      "Advanced analytics",
      "Password protected links",
      "Bulk link checking",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Premium",
    description: "For large organizations",
    price: "$29.99",
    period: "/month",
    credits: 2000,
    icon: Crown,
    features: [
      "2000 credits per month",
      "Everything in Pro",
      "API access",
      "White-label options",
      "Team collaboration",
      "Custom domains",
      "Dedicated support",
    ],
    cta: "Subscribe",
    popular: false,
  },
];

export const creditPacks = [
  { credits: 100, price: "4.99", label: "Day Pack" },
  { credits: 300, price: "9.99", label: "Week Pack" },
  { credits: 1000, price: "24.99", label: "Month Pack" },
];

export const footerLinks = {
  Product: ["Features", "Pricing", "API", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Resources: ["Documentation", "Help Center", "Community", "Status"],
  Legal: ["Privacy", "Terms", "Security"],
};

export const menuItems = [
  { 
    section: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    ]
  },
  { 
    section: 'Tools',
    items: [
      { icon: Link2, label: 'URL Shortener', path: '/dashboard/url-shortener' },
      { icon: QrCode, label: 'QR Code Generator', path: '/dashboard/qr-generator' },
      { icon: ScanLine, label: 'QR Code Scanner', path: '/dashboard/qr-scanner' },
      { icon: Edit3, label: 'Dynamic QR Generator', path: '/dashboard/dynamic-qr', pro: true },
      { icon: ExternalLink, label: 'Link Expander', path: '/dashboard/link-expander' },
      { icon: LinkIcon, label: 'Broken Link Checker', path: '/dashboard/broken-link-checker' },
      { icon: Barcode, label: 'Barcode Generator', path: '/dashboard/barcode-generator' },
      { icon: ScanBarcode, label: 'Barcode Decoder', path: '/dashboard/barcode-decoder' },
      { icon: Globe, label: 'DNS & Domain Checker', path: '/dashboard/dns-checker' },
      { icon: Clock, label: 'One-Time Links', path: '/dashboard/one-time-link', pro: true },
    ]
  },
  { 
    section: 'Account',
    items: [
      { icon: Settings, label: 'Settings', path: '/settings' },
    ]
  },
];

export const dashBoardTools = [
  { name: "URL Shortener", href: "/dashboard/url-shortener", icon: Link2 },
  { name: "QR Code Generator", href: "/dashboard/qr-generator", icon: QrCode },
  { name: "QR Code Scanner", href: "/dashboard/qr-scanner", icon: ScanLine },
  { name: "Dynamic QR Generator", href: "/dashboard/dynamic-qr", icon: Edit3 },
  { name: "Link Expander", href: "/dashboard/link-expander", icon: ExternalLink },
  { name: "Broken Link Checker", href: "/dashboard/broken-link-checker", icon: LinkIcon },
  { name: "Barcode Generator", href: "/dashboard/barcode-generator", icon: Barcode },
  { name: "Barcode Decoder", href: "/dashboard/barcode-decoder", icon: ScanBarcode },
  { name: "One-Time Link", href: "/dashboard/one-time-link", icon: Clock },
  { name: "DNS & Domain Checker", href: "/dashboard/dns-checker", icon: Globe },
];

export const ANALYTICS_REFRESH_DELAY_SECONDS = 6000;