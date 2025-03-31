import { createContext, useState, useEffect } from "react";

export const logincontext = createContext();

function Contextapi({ children }) {
    const [loginUser, setLoginUser] = useState(() => {
        // Retrieve stored user data from sessionStorage on initial load
        const storedUser = sessionStorage.getItem("loginUser");
        return storedUser ? JSON.parse(storedUser) : {};
    });

    useEffect(() => {
        // Store loginUser in sessionStorage whenever it changes
        sessionStorage.setItem("loginUser", JSON.stringify(loginUser));
    }, [loginUser]);

    return (
        <logincontext.Provider value={[loginUser, setLoginUser]}>
            {children}
        </logincontext.Provider>
    );
}

export default Contextapi;
