import { Card, type CardProps } from "@heroui/react";

type UiCardComponent = typeof Card & {
  Header: typeof Card.Header;
  Content: typeof Card.Content;
  Title: typeof Card.Title;
  Description: typeof Card.Description;
};

function UiCardBase({ className, variant = "default", ...props }: CardProps) {
  const nextClassName = ["ui-panel bg-transparent p-3 sm:p-4", className]
    .filter(Boolean)
    .join(" ");

  return <Card className={nextClassName} variant={variant} {...props} />;
}

export const UiCard = Object.assign(UiCardBase, {
  Header: Card.Header,
  Content: Card.Content,
  Title: Card.Title,
  Description: Card.Description,
}) as UiCardComponent;
