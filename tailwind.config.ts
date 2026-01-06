import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-conic":
                    "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0) rotate(var(--tw-rotate))' },
                    '50%': { transform: 'translateY(-20px) rotate(var(--tw-rotate))' },
                }
            },
            animation: {
                float: 'float 6s ease-in-out infinite',
            }
        },
    },
    plugins: [],
};
export default config;
