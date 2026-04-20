import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
    const AuthComponent = (props) => {
        const router = useNavigate();

        const isAuthenticated = () => {
            return !!localStorage.getItem("token");
        };

        useEffect(() => {
            if (!isAuthenticated()) {
                // Save intended URL so we can redirect back after login
                sessionStorage.setItem(
                    "redirectAfterLogin",
                    window.location.pathname + window.location.search
                );
                router("/auth");
            }
        }, []);

        return <WrappedComponent {...props} />;
    };

    return AuthComponent;
};

export default withAuth;