import * as React from "react";

function CoraboLogo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 40"
      width="200"
      height="40"
      {...props}
    >
      <text
        x="0"
        y="30"
        fontFamily="Arial, sans-serif"
        fontSize="35"
        fontWeight="bold"
        fill="currentColor"
      >
        corab
        <tspan fill="hsl(var(--primary))">O</tspan>
      </text>
    </svg>
  );
}

export default CoraboLogo;
