import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    // Check if the user is logged in (exists in sessionStorage)
    const loginUser = JSON.parse(sessionStorage.getItem("loginUser"));

    return loginUser && loginUser.email ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
