



import React, { useState } from 'react';
import Link from 'next/link';
import Logo from 'src/components/Logo';
import AuthAndHamburgerSection from './authAndHamburgerSection';
import SearchMenu from './searchMenu';

const SearchComponent = () => {
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isCompanyDropdownOpen, setCompanyDropdownOpen] = useState(false);
    const [isDesignDropdownOpen, setDesignDropdownOpen] = useState(false);


    const handleMenuToggle = () => {
        setMenuOpen(!isMenuOpen);
    };

    const handleCompanyDropdownToggle = () => {
        setCompanyDropdownOpen(!isCompanyDropdownOpen);
    };

    const handleDesignDropdownToggle = () => {
        setDesignDropdownOpen(!isDesignDropdownOpen);
    };

    return (
        <header>
            <nav className="bg-white border-gray-200 px-4 lg:px-6 py-2.5 dark:bg-gray-800">
                <div className="grid grid-cols-3 items-center mx-auto">
                    <Logo />
                    <AuthAndHamburgerSection handleMenuToggle={handleMenuToggle} isMenuOpen={isMenuOpen} />
                    <SearchMenu isMenuOpen={isMenuOpen} handleCompanyDropdownToggle={handleCompanyDropdownToggle} isCompanyDropdownOpen={isCompanyDropdownOpen} handleDesignDropdownToggle={handleDesignDropdownToggle} isDesignDropdownOpen={isDesignDropdownOpen} />

                </div>
            </nav>
        </header>
    );
}

export default SearchComponent;
