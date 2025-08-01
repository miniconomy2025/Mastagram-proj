import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import "./Pagination.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

type PaginationLinkProps = {
  isActive?: boolean;
  href?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

export const Pagination: React.FC<React.HTMLAttributes<HTMLElement>> = ({ className = "", ...props }) => (
  <nav role="navigation" aria-label="pagination" className={`pagination-nav ${className}`} {...props} />
);

export const PaginationContent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className = "", ...props }, ref) => (
    <ul ref={ref} className={`pagination-content ${className}`} {...props} />
  )
);

export const PaginationItem = React.forwardRef<HTMLLIElement, React.HTMLAttributes<HTMLLIElement>>(
  ({ className = "", ...props }, ref) => (
    <li ref={ref} className={`pagination-item ${className}`} {...props} />
  )
);

export const PaginationLink: React.FC<PaginationLinkProps> = ({ isActive, className = "", children, ...props }) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={`pagination-link ${isActive ? "active" : ""} ${className}`}
    {...props}
  >
    {children}
  </a>
);

export const PaginationPrevious: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  className = "",
  ...props
}) => (
  <PaginationLink className={`pagination-prev ${className}`} {...props}>
    <ChevronLeft size={16} />
    <span>Previous</span>
  </PaginationLink>
);

export const PaginationNext: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({
  className = "",
  ...props
}) => (
  <PaginationLink className={`pagination-next ${className}`} {...props}>
    <span>Next</span>
    <ChevronRight size={16} />
  </PaginationLink>
);

export const PaginationEllipsis: React.FC<React.HTMLAttributes<HTMLSpanElement>> = ({ className = "", ...props }) => (
  <span className={`pagination-ellipsis ${className}`} aria-hidden {...props}>
    <MoreHorizontal size={16} />
    <span className="sr-only">More pages</span>
  </span>
);
