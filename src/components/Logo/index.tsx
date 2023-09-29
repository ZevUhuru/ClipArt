import React from "react";
import Link from "next/link";

const Logo = () => {
    return (
        <Link href="/" className="flex items-center lg:justify-center lg:order-2">
            <img src="https://assets.codepen.io/9394943/color-logo-no-bg.svg" className="mr-3 h-6 sm:h-9" alt="Clip.Art Logo" />
        </Link>
    )
}

export default Logo;