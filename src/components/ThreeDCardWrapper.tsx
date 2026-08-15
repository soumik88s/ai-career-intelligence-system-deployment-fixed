import React, { useState } from "react";
import { motion } from "motion/react";

interface ThreeDCardWrapperProps {
  children: React.ReactNode;
  className?: string;
  depth?: number;
  glowColor?: string;
}

export const ThreeDCardWrapper: React.FC<ThreeDCardWrapperProps> = ({
  children,
  className = "",
  depth = 15,
  glowColor = "rgba(56, 189, 248, 0.15)"
}) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -depth;
    const rotY = ((x - centerX) / centerX) * depth;

    setRotateX(rotX);
    setRotateY(rotY);

    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.25,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      className={`perspective-1000 transform-style-3d relative transition-transform duration-200 ease-out ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      style={{
        boxShadow: glarePos.opacity > 0 ? `0 20px 40px -15px ${glowColor}` : "none",
      }}
    >
      {/* 3D Glare Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-20 rounded-3xl transition-opacity duration-300"
        style={{
          opacity: glarePos.opacity,
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.3) 0%, transparent 60%)`,
        }}
      />
      {children}
    </motion.div>
  );
};
