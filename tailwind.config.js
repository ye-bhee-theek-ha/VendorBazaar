/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './app/**/*.{js,jsx,ts,tsx}',
        './src/components/**/*.{js,jsx,ts,tsx}',
    ],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                "primary": "#OB6623"
            },
            fontSize: {
                "hero": "30px",
                "heading": "24px",
                'text': '20px',
                "btn_title": "18px",
                "medium": "16px",
                "small": "14px",
                "extra_small": '12px',
                "icon_text": '10px'

            },
            fontFamily: {
                default: ['AlbertSans'],
            },
        },
    },
    plugins: [],
}
