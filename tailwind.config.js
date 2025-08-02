/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,jsx,ts,tsx}",
		"./components/**/*.{js,jsx,ts,tsx}",
	],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: {
				// Light mode colors
				light: {
					bg: '#f8fafc', // slate-50
					card: '#ffffff',
					text: {
						primary: '#1e293b', // slate-800
						secondary: '#64748b', // slate-500
						tertiary: '#475569', // slate-600
					},
					border: '#e2e8f0', // slate-200
					accent: '#3b82f6', // blue-500
				},
				// Dark mode colors
				dark: {
					bg: '#0f172a', // slate-900
					card: '#1e293b', // slate-800
					text: {
						primary: '#f1f5f9', // slate-100
						secondary: '#cbd5e1', // slate-300
						tertiary: '#94a3b8', // slate-400
					},
					border: '#334155', // slate-700
					accent: '#3b82f6', // blue-500
				},
			},
		},
	},
	plugins: [],
}

