const CrownLogo = () => {
    return (
        <div className="absolute top-6 left-6 w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg">
            <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-7 h-7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path
                    d="M2 17L5 7L9 12L12 4L15 12L19 7L22 17H2Z"
                    fill="#1a1a2e"
                    stroke="#1a1a2e"
                />
                <circle cx="5" cy="19" r="1" fill="#1a1a2e" />
                <circle cx="12" cy="19" r="1" fill="#1a1a2e" />
                <circle cx="19" cy="19" r="1" fill="#1a1a2e" />
            </svg>
        </div>
    );
};

export default CrownLogo;
