import React from "react";
import "./Skeleton.css";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className = "", ...props }: SkeletonProps) {
  return <div className={`skeleton ${className}`} {...props} />;
}

export { Skeleton };
