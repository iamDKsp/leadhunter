const CrownLogo = () => {
    return (
        <div className="absolute top-6 left-6 w-20 h-20 flex items-center justify-center transition-transform hover:scale-105 duration-300">
            <img
                src="/logo-lion.png"
                alt="Lead Hunter Logo"
                className="w-full h-full object-contain drop-shadow-xl"
            />
        </div>
    );
};

export default CrownLogo;
