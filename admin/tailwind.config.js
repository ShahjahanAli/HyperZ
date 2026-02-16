/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font)'],      // Inter
                mono: ['var(--mono)'],      // JetBrains Mono
                tactical: ['var(--tactical)'], // Orbitron
            },
            colors: {
                'hyperz-bg': 'var(--bg)',
                'hyperz-card': 'var(--bg-card)',
                'hyperz-border': 'var(--border)',
                'hyperz-accent': 'var(--accent)',
            },
        },
    },
    plugins: [],
};
