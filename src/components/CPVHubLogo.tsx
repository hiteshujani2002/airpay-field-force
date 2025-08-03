const CPVHubLogo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 160 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cool shield verification icon */}
      <path d="M16 2L10 4V10C10 14 12 17 16 18C20 17 22 14 22 10V4L16 2Z" fill="hsl(258 90% 66%)" stroke="hsl(258 90% 76%)" strokeWidth="1"/>
      <path d="M14 9L15.5 10.5L18 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      
      {/* Tech hexagon background */}
      <path d="M28 4L32 2L40 2L44 4L44 12L40 14L32 14L28 12Z" fill="hsl(258 90% 66%)" />
      <path d="M30 6L34 5L38 5L42 6L42 10L38 11L34 11L30 10Z" fill="hsl(258 90% 76%)" />
      
      {/* Circuit lines */}
      <path d="M44 8L48 8" stroke="hsl(258 90% 66%)" strokeWidth="2"/>
      <path d="M48 6L48 10" stroke="hsl(258 90% 66%)" strokeWidth="2"/>
      
      {/* Company name */}
      <text x="52" y="12" fontSize="10" fontWeight="700" fill="hsl(258 90% 66%)" fontFamily="system-ui, sans-serif">
        CPV
      </text>
      <text x="52" y="24" fontSize="10" fontWeight="500" fill="hsl(220 14% 96%)" fontFamily="system-ui, sans-serif">
        HUB
      </text>
    </svg>
  );
};

export default CPVHubLogo;