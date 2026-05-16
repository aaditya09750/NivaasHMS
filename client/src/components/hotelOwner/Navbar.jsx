import React from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Logo from '../Logo';

const Navbar = () => {
  return (
    <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white transition-all duration-300">
      <Link to="/">
        <Logo className="h-9 w-auto invert opacity-80" />
      </Link>
      <UserButton />
    </div>
  );
};

export default Navbar;
