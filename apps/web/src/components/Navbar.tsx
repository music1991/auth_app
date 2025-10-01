import Link from "next/link";
import { cookies } from "next/headers";
import { ClientLogoutButton } from "./ClientLogoutButton";

import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  // NavigationMenuTrigger,
  // NavigationMenuContent,
} from "@/components/ui/navigation-menu";

export const dynamic = "force-dynamic";

export default async function Navbar() {
  const cs = await cookies();
  const role = cs.get("role")?.value ?? "user";
  const isAdmin = role === "admin";

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          Auth App (Demo)
        </Link>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {isAdmin && (
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link href="/users">Users</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )}

            {/* <NavigationMenuItem>
              <NavigationMenuTrigger>More</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 w-[200px]">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/about">About</Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link href="/settings">Settings</Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem> */}
          </NavigationMenuList>
        </NavigationMenu>

        <ClientLogoutButton />
      </div>
    </header>
  );
}
