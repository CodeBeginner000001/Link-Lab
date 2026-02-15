import UserAvatar from "../common/UserAvatar";
import ToggleTheme from "../ui/ToggleTheme";

export default function Header() {
  return (
    <header className="h-16 border-b border-[hsl(var(--sidebar-border))] flex items-center justify-end px-6 gap-4 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <ToggleTheme />
      <UserAvatar/>
    </header>
  );
}
