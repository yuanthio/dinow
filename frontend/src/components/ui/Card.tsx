import * as React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "blue" | "soft";
}

export function Card({
  children,
  className = "",
  variant = "default",
  ...props
}: CardProps) {
  const base = "rounded-2xl border-2 shadow-sm bg-white";

  const variants = {
    default: "border-gray-200 shadow-sm",
    blue: "border-blue-100 shadow-xl bg-gradient-to-br from-blue-50 to-white",
    soft: "border-blue-50 shadow-sm bg-blue-50/50",
  };

  return (
    <div className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({
  children,
  className = "",
  ...props
}: CardContentProps) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}
