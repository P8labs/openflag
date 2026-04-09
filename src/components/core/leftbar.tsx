import {
  Add01Icon,
  Home01Icon,
  Link01Icon,
  Notification02Icon,
  Rocket01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Image from "next/image";
import Link from "next/link";

const menuList = [
  { name: "Feed", link: "/feed", icon: Home01Icon },
  { name: "Projects", link: "/projects", icon: Rocket01Icon },
  { name: "Post", link: "/post-project", icon: Add01Icon },
  { name: "Matches", link: "/matches", icon: Link01Icon },
  { name: "Notifications", link: "/notifications", icon: Notification02Icon },
  { name: "Settings", link: "/settings", icon: Settings01Icon },
];

export default function LeftBar() {
  return (
    <div className="h-screen sticky top-0 flex flex-col justify-between pt-2 pb-8">
      <div className="flex flex-col gap-4 text-lg items-center xxl:items-start">
        <Link href="/" className="rounded-xs p-2 hover:bg-default">
          <Image src="/openflag.png" alt="logo" width={24} height={24} />
        </Link>
        <div className="flex flex-col gap-4">
          {menuList.map((item) => (
            <Link
              href={item.link}
              key={item.link}
              className="flex items-center gap-4 rounded-xs p-2 hover:bg-default"
            >
              <HugeiconsIcon icon={item.icon} height={24} width={24} />

              <span className="hidden xxl:inline">{item.name}</span>
            </Link>
          ))}
        </div>
        <Link
          href="/post-project"
          className="ui-button-primary flex h-12 w-12 items-center justify-center xxl:hidden"
        >
          <HugeiconsIcon icon={Add01Icon} />
        </Link>
      </div>
    </div>
  );
}
