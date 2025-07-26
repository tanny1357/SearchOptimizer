import React, { useState } from 'react';

// Main App component
const App = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Function to handle form submission
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission
        // In a real application, you would send this data to a backend for authentication
        console.log('Login attempt with:', { email, password });
        // You could add logic here for displaying success/error messages
        alert('Login functionality is not implemented in this demo. Check console for input values.');
    };

    return (
        <div className="bg-flipkart-grey min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Login Card Container */}
            <div className="flex flex-col md:flex-row bg-white rounded-lg shadow-lg overflow-hidden max-w-4xl w-full">
                {/* Left Section (Image/Branding) */}
                <div className="bg-flipkart-blue p-8 md:w-1/2 flex flex-col justify-between text-flipkart-light rounded-t-lg md:rounded-l-lg md:rounded-tr-none">
                    <div>
                        <h2 className="text-3xl font-bold mb-2">Login</h2>
                        <p className="text-lg">Get access to your Orders, Wishlist and Recommendations</p>
                    </div>
                    {/* Placeholder for an image or additional branding */}
                    <div className="mt-8 flex justify-center items-center">
                        {/* You can replace this with a Flipkart-like illustration or logo */}
                        <img src="https://placehold.co/200x200/2874F0/FFFFFF?text=Flipkart" alt="Flipkart Illustration" className="w-48 h-48 object-contain rounded-full" />
                    </div>
                </div>

                {/* Right Section (Login Form) */}
                <div className="p-8 md:w-1/2 flex flex-col justify-center bg-white rounded-b-lg md:rounded-r-lg md:rounded-bl-none">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="sr-only">Enter Email/Mobile number</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Enter Email/Mobile number"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-flipkart-blue focus:border-transparent transition duration-200 ease-in-out text-flipkart-dark"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Enter Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Enter Password"
                                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-flipkart-blue focus:border-transparent transition duration-200 ease-in-out text-flipkart-dark"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="text-right">
                            <a href="#" className="text-flipkart-blue text-sm font-semibold hover:underline">Forgot?</a>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-flipkart-yellow text-flipkart-dark font-semibold py-3 px-4 rounded-md shadow-md hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-75 transition duration-200 ease-in-out"
                        >
                            Login
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <p>New to Flipkart? <a href="#" className="text-flipkart-blue font-semibold hover:underline">Create an account</a></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;

// Global CSS for Flipkart colors (as Tailwind doesn't directly support CSS variables in JIT mode without config)
// This would typically be in an index.css or global.css file in a React project
// For this immersive, we include it as a string for demonstration.
// In a real React project, you'd configure Tailwind to use these custom colors.
const globalCss = `
    :root {
        --flipkart-blue: #2874F0; /* Flipkart's primary blue */
        --flipkart-yellow: #FFE500; /* Flipkart's accent yellow/orange */
        --flipkart-dark-text: #212121; /* Dark text color */
        --flipkart-light-text: #FFFFFF; /* Light text color */
        --flipkart-grey-bg: #F0F2F5; /* Light grey background */
    }

    .bg-flipkart-blue { background-color: var(--flipkart-blue); }
    .text-flipkart-blue { color: var(--flipkart-blue); }
    .bg-flipkart-yellow { background-color: var(--flipkart-yellow); }
    .text-flipkart-yellow { color: var(--flipkart-yellow); }
    .text-flipkart-dark { color: var(--flipkart-dark-text); }
    .text-flipkart-light { color: var(--flipkart-light-text); }
    .bg-flipkart-grey { background-color: var(--flipkart-grey-bg); }

    body {
        font-family: 'Inter', sans-serif; /* Using Inter font */
    }
`;

// Inject global CSS for demonstration purposes within the immersive environment.
// In a standard React project, you would import a CSS file.
if (typeof document !== 'undefined') {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = globalCss;
    document.head.appendChild(styleTag);
}
