import { Outlet } from "react-router-dom";
import LeftBar from "./Shell/LeftBar";
import RightBar from "./Shell/RightBar";
import MobileBar from "./Shell/Mobilebar";

export function AppShell() {
  return (
    <div className="min-h-screen p-2 w-full">
      <div className="mx-auto flex w-full max-w-450 items-start justify-center">
        <aside className="hidden md:flex shrink-0">
          <LeftBar />
        </aside>

        <main className="w-full min-w-0 max-w-3xl lg:max-w-5xl xl:max-w-7xl h-[calc(100vh-1rem)] border border-secondary bg-secondary/20">
          <Outlet />
        </main>

        <aside className="hidden lg:flex w-full max-w-md shrink-0">
          <RightBar />
        </aside>

        <MobileBar />
      </div>
    </div>
  );
}
