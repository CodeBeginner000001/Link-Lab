import UserAvatar from "../common/UserAvatar";
import ToggleTheme from "../ui/ToggleTheme";

export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 h-16 border-b border-[hsl(var(--sidebar-border))] bg-background/80 px-6 backdrop-blur-sm flex items-center justify-end gap-4">
      <ToggleTheme />
      <UserAvatar/>
    </header>
  );
}
