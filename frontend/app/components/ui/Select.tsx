import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { CheckIcon, ChevronDownIcon } from "@radix-ui/react-icons"
import { cn } from "../../lib/utils"


type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & {
  className?: string;
  children?: React.ReactNode;
  placeholder?: string;
};

const Select = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Trigger>, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => (
    <SelectPrimitive.Root {...props}>
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex w-full items-center justify-between rounded-2xl border bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 text-gray-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200",
          className
        )}
      >
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon>
          <ChevronDownIcon className="h-5 w-5 text-gray-500" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Content 
        className="z-50 rounded-2xl border bg-white shadow-lg overflow-hidden"
        position="popper"
        side="bottom"
        sideOffset={-120}
        align="start"
        avoidCollisions={false}
        style={{
          maxHeight: '250px',
          minHeight: '150px'
        }}
      >
        <SelectPrimitive.Viewport className="p-1 overflow-y-auto scrollbar-hide" style={{ maxHeight: '230px' }}>
          {children}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Root>
  )
);
Select.displayName = "Select";

type SelectItemProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> & {
  className?: string;
  children?: React.ReactNode;
};

const SelectItem = React.forwardRef<React.ElementRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, children, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
              className={cn(
          "relative flex w-full cursor-pointer select-none items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-700 outline-none transition-colors focus:bg-blue-50 focus:text-blue-900 hover:bg-blue-100",
          className
        )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2 flex items-center">
        <CheckIcon className="h-4 w-4 text-blue-600" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  )
);
SelectItem.displayName = "SelectItem";

export { Select, SelectItem };
