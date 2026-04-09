"use client";
import { usePathname } from "next/navigation";
import LeftBar from "./leftbar";
import RightBar from "./rightbar";

const noShell = ["/", "/auth"];

export default function CoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (noShell.includes(pathname)) {
    return children;
  }

  return (
    <div className="mx-auto flex max-w-3xl justify-between lg:max-w-5xl xl:max-w-7xl xxl:max-w-screen-xxl">
      <div className="px-2 xsm:px-4 xxl:px-8">
        <LeftBar />
      </div>
      <div className="w-full rounded-xs border border-border bg-surface lg:min-w-150">
        {children}
      </div>
      <div className="ml-4 hidden lg:flex md:ml-8">
        <RightBar />
      </div>
    </div>
  );
}
