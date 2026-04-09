import type { SVGProps } from "react";
import {
  BellIcon as HeroBellIcon,
  HeartIcon as HeroHeartIcon,
  HomeIcon as HeroHomeIcon,
  PlusIcon as HeroPlusIcon,
  Squares2X2Icon as HeroGridIcon,
  UserIcon as HeroUserIcon,
} from "@heroicons/react/24/outline";

type IconProps = SVGProps<SVGSVGElement>;

export function HomeIcon(props: IconProps) {
  return <HeroHomeIcon {...props} />;
}

export function GridIcon(props: IconProps) {
  return <HeroGridIcon {...props} />;
}

export function PlusIcon(props: IconProps) {
  return <HeroPlusIcon {...props} />;
}

export function BellIcon(props: IconProps) {
  return <HeroBellIcon {...props} />;
}

export function UserIcon(props: IconProps) {
  return <HeroUserIcon {...props} />;
}

export function HeartIcon(props: IconProps) {
  return <HeroHeartIcon {...props} />;
}
