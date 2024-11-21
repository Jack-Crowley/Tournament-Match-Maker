"use client";

import Link from 'next/link';
import './navbar.css';
import { useAuthentication } from '@/contexts/authenticationContext';
import { useEffect, useState } from 'react';

export const Navbar = () => {
    const {session} = useAuthentication()
    const [loggedIn, setLoggedIn] = useState(false)

    useEffect(() => {
        setLoggedIn(!(!session))
    }, [session])


    return (
        <nav className="navbar">
            <div className="right">
                <Link href="/" className="nav-link dashboard">Dashboard</Link>
                <Link href="/realtime" className="nav-link realtime">Realtime</Link>
                {loggedIn ? (
                    <Link href="/logout" className="nav-link logout">Logout</Link>
                ) : (
                    <Link href="/login" className="nav-link login">Login</Link>
                )}
            </div>
        </nav>
    );
};