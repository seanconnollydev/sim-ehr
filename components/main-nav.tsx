import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/author", label: "Author" },
  { href: "/student", label: "Student" },
];

export function MainNav() {
  return (
    <NavigationMenu className="max-w-none justify-start">
      <NavigationMenuList>
        {links.map(({ href, label }) => (
          <NavigationMenuItem key={href}>
            <Link
              href={href}
              className={cn(navigationMenuTriggerStyle(), "bg-transparent")}
            >
              {label}
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
