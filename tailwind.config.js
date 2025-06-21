/** @type {import('tailwindcss').Config} */
module.exports = {
    // Tailwind v3 (recommended)
    mode: 'jit', // 👈 add this line for Tailwind 2.x
    content: ['./src/**/*.{html,ts}'],

    // …or Tailwind v2 syntax:
    // purge: ['./src/**/*.html', './src/**/*.ts'],
    safelist: [
        'bg-[#EFAC2B]',
        'bg-[#595FED]',
        'bg-[#ED63DF]',
        'bg-[#8CD135]',
        'px-[18px]',
        'mb-[20px]',
        'w-[610px]',
        'w-[517px]',
        'w-[380px]',
        'text-[13px]/[27px]',
        'text-[21px]/[27px]',
        'font-bold',
        'text-[#08295B]',
        'text-[13px]/[27px]'
    ],
    theme: {
        extend: {
            colors: {
                custombg: 'rgba(231, 239, 246, 0.33)',
                customsubtext: 'rgba(16, 33, 58, 0.6)'
            },

        }
    },
    plugins: [],
};