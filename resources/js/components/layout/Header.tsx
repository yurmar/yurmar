import React from "react"
import { ThemeToggle } from "../ThemeToggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { NavLink } from "react-router-dom";

export default function Header() {
    return (
        <header className="w-full flex h-20 items-center justify-between px-5 fixed z-50">
            <NavLink to="/">
                <div className="flex items-center gap-3">
                    <Avatar className="logo bg-glass w-12 h-12 overflow-hidden">
                        <AvatarImage
                            src="/images/logo.png"
                        />
                        <AvatarFallback>
                            YM
                        </AvatarFallback>
                    </Avatar>
                    <div className="bg-glass text-white rounded-4xl p-2 font-bold text-lg md:text-2xl">
                        YurMar
                    </div>
                </div>
            </NavLink>
            <div className="flex items-center gap-3">
                <div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
}