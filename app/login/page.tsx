'use client'

import Link from 'next/link';
import { login, signup } from './action'
import styles from "./login.module.css"
import Image from "next/image";
import { useEffect, useState } from "react";

export default function LoginPage() {
  useEffect(() => {
    document.title = 'Login'
}, [])
  const [loginMenu, setLoginMenu] = useState(true);
  const [errorString, setErrorString] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorString(""); // Clear any previous errors

    const formData = new FormData(e.currentTarget); // Use e.currentTarget to get the form element
    const action = loginMenu ? login : signup;
    const result = await action(formData);

    if (result?.error) {
      setErrorString(result.error);
    }
  };

  return (
    <div>
      <div className={styles.parentDiv}>
        <div className={styles.loginDiv}>
          <h1 className={styles.loginHeader}>Sign {loginMenu ? "In" : "Up"}</h1>

          {errorString && <p className={styles.errorMessage}>{errorString}</p>}

          <form onSubmit={handleSubmit}>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              className={styles.input}
              required
            />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Password"
              className={`${styles.input} ${styles.passwordInput}`}
              required
            />
            <button type="submit" className={`${styles.button}`}>
              {loginMenu ? "Log in" : "Sign Up"}
            </button>
          </form>

          <h3
            className={styles.switch}
            onClick={() => setLoginMenu(!loginMenu)}
          >
            {loginMenu ? "Don't have an account?" : "Already have an account?"}
            {/* Sign {loginMenu ? "Up" : "In"} Instead? */}
          </h3>
        </div>
      </div>
    </div>
  );
}
