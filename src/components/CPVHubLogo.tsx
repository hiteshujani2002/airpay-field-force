const CPVHubLogo = ({ className = "h-8 w-auto" }: { className?: string }) => {
  return (
    <svg className={className} viewBox="0 0 180 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Modern network/connection icon */}
      <circle cx="8" cy="16" r="3" fill="hsl(258 90% 66%)"/>
      <circle cx="24" cy="8" r="2.5" fill="hsl(258 90% 76%)"/>
      <circle cx="24" cy="24" r="2.5" fill="hsl(258 90% 76%)"/>
      <circle cx="40" cy="16" r="3" fill="hsl(258 90% 66%)"/>
      
      {/* Connection lines */}
      <line x1="11" y1="16" x2="21" y2="10" stroke="hsl(258 90% 66%)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="11" y1="16" x2="21" y2="22" stroke="hsl(258 90% 66%)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27" y1="8" x2="37" y2="14" stroke="hsl(258 90% 76%)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="27" y1="24" x2="37" y2="18" stroke="hsl(258 90% 76%)" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Digital pulse effect */}
      <circle cx="8" cy="16" r="5" fill="none" stroke="hsl(258 90% 66%)" strokeWidth="1" opacity="0.3"/>
      <circle cx="40" cy="16" r="5" fill="none" stroke="hsl(258 90% 66%)" strokeWidth="1" opacity="0.3"/>
      
      {/* Separator line */}
      <line x1="52" y1="8" x2="52" y2="24" stroke="hsl(258 90% 66%)" strokeWidth="2" strokeLinecap="round"/>
      
      {/* Company name */}
      <text x="60" y="12" fontSize="11" fontWeight="700" fill="hsl(258 90% 66%)" fontFamily="system-ui, sans-serif">
        CPV
      </text>
      <text x="60" y="24" fontSize="11" fontWeight="500" fill="hsl(220 14% 96%)" fontFamily="system-ui, sans-serif">
        HUB
      </text>
    </svg>
  );
};

export default CPVHubLogo;