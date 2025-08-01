import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import "./Avatar.css"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className = "", ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={`avatar ${className}`}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className = "", ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={`avatar-image ${className}`}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className = "", ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={`avatar-fallback ${className}`}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
