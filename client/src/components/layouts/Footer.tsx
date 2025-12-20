import { Github, Instagram, Twitter } from "lucide-react";
import { footerLinks } from "../../utils/content";
import Logo from "../Logo";

export default function Footer() {

  return (
    <footer className="bg-[hsl(var(--card))] border-t border-[hsl(var(--border))]">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 text-[hsl(var(--muted-foreground))] text-sm">
              Powerful tools to enhance your digital workflow.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-[hsl(var(--foreground))] mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-[hsl(var(--border))] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[hsl(var(--muted-foreground))] text-sm text-center">
            © 2024 LinkLab. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <Twitter/>
            </a>
            <a href="#" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <Github/>
            </a>
            <a href="#" className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              <Instagram/>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};


