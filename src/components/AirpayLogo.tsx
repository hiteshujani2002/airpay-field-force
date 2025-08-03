const AirpayLogo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 120 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="24" fontSize="24" fontWeight="bold" fill="hsl(202 89% 45%)" fontFamily="system-ui, sans-serif">
        airpay
      </text>
    </svg>
  );
};

export default AirpayLogo;