import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../components/NavBar";

const NotFound = () => {

    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[url('/bg_img.png')] text-center px-6">

            <NavBar />

            {/* 404 number */}
            <h1 className="text-7xl font-bold text-gray-800 mb-4">404</h1>

            {/* message */}
            <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
            <p className="text-gray-700 mb-6 max-w-md">
                The page you are looking for doesn't exist or has been moved.
            </p>

            {/* go home button */}
            <button
                onClick={() => navigate("/")}
                className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition"
            >
                Go Home
            </button>

        </div>
    );
};

export default NotFound;