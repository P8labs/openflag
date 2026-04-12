import { Outlet } from "react-router-dom";
import LeftBar from "./Shell/LeftBar";
import MobileTopBar from "./Shell/MobileTopBar";
import RightBar from "./Shell/RightBar";
import MobileBar from "./Shell/Mobilebar";
import { PostComposerProvider } from "./posts/PostComposerProvider";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";

export function AppShell() {
  return (
    <PostComposerProvider>
      <div className="min-h-screen p-2 w-full">
        <div className="mx-auto flex w-full max-w-450 items-start justify-center">
          <aside className="hidden md:flex shrink-0">
            <LeftBar />
          </aside>

          <ScrollArea className="mb-16 md:mb-0 w-full min-w-0 max-w-3xl md:h-[calc(100vh-1rem)] h-[calc(100vh-5rem)] overflow-y-auto border border-secondary bg-secondary/20">
            <MobileTopBar />
            <Outlet />
            <ScrollBar className="w-1" />
          </ScrollArea>

          <aside className="hidden lg:flex w-full max-w-md shrink-0">
            <RightBar />
          </aside>

          <MobileBar />
        </div>
      </div>
    </PostComposerProvider>
  );
}
