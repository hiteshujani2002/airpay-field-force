const CPVHubLogo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 140 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Tech hexagon background */}
      <path d="M8 4L12 2L20 2L24 4L24 12L20 14L12 14L8 12Z" fill="hsl(258 90% 66%)" />
      <path d="M10 6L14 5L18 5L22 6L22 10L18 11L14 11L10 10Z" fill="hsl(258 90% 76%)" />
      
      {/* Circuit lines */}
      <path d="M24 8L28 8" stroke="hsl(258 90% 66%)" strokeWidth="2"/>
      <path d="M28 6L28 10" stroke="hsl(258 90% 66%)" strokeWidth="2"/>
      
      {/* Company name */}
      <text x="32" y="12" fontSize="10" fontWeight="700" fill="hsl(258 90% 66%)" fontFamily="system-ui, sans-serif">
        CPV
      </text>
      <text x="32" y="24" fontSize="10" fontWeight="500" fill="hsl(220 14% 96%)" fontFamily="system-ui, sans-serif">
        HUB
      </text>
    </svg>
  );
};

export default CPVHubLogo;