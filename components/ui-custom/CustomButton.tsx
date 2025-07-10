import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import * as React from "react";

interface CustomButtonProps extends React.ComponentProps<typeof Button> {
    customVariant?: "gradient" | "outlineYellow" | "textOnly" | "dark";
}

export const CustomButton = React.forwardRef<HTMLButtonElement, CustomButtonProps>(
    ({ customVariant, className, ...props }, ref) => {
        let customClass = "";
        if (customVariant === "gradient") {
            customClass =
                "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:to-yellow-600 text-black shadow-lg rounded-full px-8 py-4 focus:ring-4 focus:ring-yellow-300 font-semibold transition-all duration-200 transform";
        } else if (customVariant === "outlineYellow") {
            customClass =
                "inline-flex justify-center items-center gap-2 bg-transparent hover:bg-yellow-500/10 px-8 py-4 border-2 border-yellow-400 hover:border-yellow-500 rounded-full focus:ring-4 focus:ring-yellow-300 font-semibold text-yellow-300 transition-all duration-200 transform";
        } else if (customVariant === "textOnly") {
            customClass =
                "bg-transparent border-none shadow-none outline-none ring-0 text-yellow-400 hover:text-yellow-300 font-semibold px-4 py-2 transition-colors duration-200 underline-offset-2 hover:bg-yellow-500/10 rounded-full";
        } else if (customVariant === "dark") {
            customClass =
                "bg-gradient-to-r from-yellow-900 via-yellow-800 to-yellow-700 hover:from-yellow-800 hover:to-yellow-600 text-white font-semibold px-8 py-4 rounded-full shadow-xl border border-yellow-700 focus:ring-4 focus:ring-yellow-400 transition-all duration-200 ease-in-out";
        }
        return (
            <Button
                ref={ref}
                className={cn(customClass, className)}
                {...props}
            />
        );
    }
);

CustomButton.displayName = "CustomButton";
