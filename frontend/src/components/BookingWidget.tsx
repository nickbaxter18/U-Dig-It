"use client";

import { useState } from "react";

export default function BookingWidget() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [equipment, setEquipment] = useState("kubota-svl75");

  const handleCheckAvailability = () => {
    // Redirect to booking page with pre-filled data
    const params = new URLSearchParams({
      equipment,
      startDate,
      endDate,
    });
    window.location.href = `/book?${params.toString()}`;
  };

  const isFormValid = equipment; // Only require equipment selection for basic quote check

  return (
    <>
      <style jsx global>{`
        @keyframes continuousShine {
          0% {
            transform: translateX(-120%);
            opacity: 0.1;
          }
          15% {
            opacity: 0.3;
          }
          85% {
            opacity: 0.3;
          }
          100% {
            transform: translateX(120%);
            opacity: 0.1;
          }
        }

        @keyframes continuousShine2 {
          0% {
            transform: translateX(-150%);
            opacity: 0.05;
          }
          20% {
            opacity: 0.25;
          }
          80% {
            opacity: 0.25;
          }
          100% {
            transform: translateX(150%);
            opacity: 0.05;
          }
        }

        @keyframes metalGlow {
          0% {
            opacity: 0.12;
          }
          25% {
            opacity: 0.22;
          }
          50% {
            opacity: 0.28;
          }
          75% {
            opacity: 0.22;
          }
          100% {
            opacity: 0.12;
          }
        }

        @keyframes metalGlow2 {
          0% {
            opacity: 0.08;
          }
          30% {
            opacity: 0.18;
          }
          70% {
            opacity: 0.18;
          }
          100% {
            opacity: 0.08;
          }
        }

        @keyframes subtleFlow {
          0% {
            transform: translateX(-130%) rotate(12deg);
            opacity: 0.08;
          }
          100% {
            transform: translateX(130%) rotate(12deg);
            opacity: 0.08;
          }
        }

        @keyframes subtleFlow2 {
          0% {
            transform: translateX(-140%) rotate(-8deg);
            opacity: 0.12;
          }
          100% {
            transform: translateX(140%) rotate(-8deg);
            opacity: 0.12;
          }
        }

        @keyframes borderGlow {
          0% {
            box-shadow:
              0 0 12px rgba(255, 255, 255, 0.2),
              0 0 25px rgba(255, 255, 255, 0.12),
              0 0 40px rgba(255, 255, 255, 0.06);
          }
          25% {
            box-shadow:
              0 0 18px rgba(255, 255, 255, 0.3),
              0 0 35px rgba(255, 255, 255, 0.18),
              0 0 55px rgba(255, 255, 255, 0.1);
          }
          50% {
            box-shadow:
              0 0 20px rgba(255, 255, 255, 0.35),
              0 0 40px rgba(255, 255, 255, 0.2),
              0 0 60px rgba(255, 255, 255, 0.12);
          }
          75% {
            box-shadow:
              0 0 18px rgba(255, 255, 255, 0.3),
              0 0 35px rgba(255, 255, 255, 0.18),
              0 0 55px rgba(255, 255, 255, 0.1);
          }
          100% {
            box-shadow:
              0 0 12px rgba(255, 255, 255, 0.2),
              0 0 25px rgba(255, 255, 255, 0.12),
              0 0 40px rgba(255, 255, 255, 0.06);
          }
        }

        @keyframes twinkle1 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.3);
          }
          3.7% {
            opacity: 0;
            transform: scale(0.3);
          }
          4.2% {
            opacity: 0.6;
            transform: scale(1);
          }
          4.6% {
            opacity: 1;
            transform: scale(1.2);
          }
          5.1% {
            opacity: 0.8;
            transform: scale(0.9);
          }
          5.6% {
            opacity: 0.4;
            transform: scale(0.6);
          }
          6.1% {
            opacity: 0;
            transform: scale(0.3);
          }
        }

        @keyframes twinkle2 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
          23.7% {
            opacity: 0;
            transform: scale(0.4);
          }
          24.2% {
            opacity: 0.8;
            transform: scale(1.1);
          }
          24.6% {
            opacity: 1;
            transform: scale(1.4);
          }
          25.1% {
            opacity: 0.7;
            transform: scale(1);
          }
          25.6% {
            opacity: 0.3;
            transform: scale(0.7);
          }
          26.1% {
            opacity: 0;
            transform: scale(0.4);
          }
        }

        @keyframes twinkle3 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.2);
          }
          43.7% {
            opacity: 0;
            transform: scale(0.2);
          }
          44.2% {
            opacity: 0.7;
            transform: scale(1.2);
          }
          44.6% {
            opacity: 1;
            transform: scale(1.6);
          }
          45.1% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          45.6% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          46.1% {
            opacity: 0;
            transform: scale(0.2);
          }
        }

        @keyframes twinkle4 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.5);
          }
          63.7% {
            opacity: 0;
            transform: scale(0.5);
          }
          64.2% {
            opacity: 0.8;
            transform: scale(1);
          }
          64.6% {
            opacity: 1;
            transform: scale(1.3);
          }
          65.1% {
            opacity: 0.6;
            transform: scale(0.8);
          }
          65.6% {
            opacity: 0.3;
            transform: scale(0.6);
          }
          66.1% {
            opacity: 0;
            transform: scale(0.5);
          }
        }

        @keyframes twinkle5 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.3);
          }
          83.7% {
            opacity: 0;
            transform: scale(0.3);
          }
          84.2% {
            opacity: 0.7;
            transform: scale(1.1);
          }
          84.6% {
            opacity: 1;
            transform: scale(1.5);
          }
          85.1% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          85.6% {
            opacity: 0.2;
            transform: scale(0.5);
          }
          86.1% {
            opacity: 0;
            transform: scale(0.3);
          }
        }

        @keyframes twinkle6 {
          0%,
          100% {
            opacity: 0;
            transform: scale(0.4);
          }
          93.7% {
            opacity: 0;
            transform: scale(0.4);
          }
          94.2% {
            opacity: 0.6;
            transform: scale(1);
          }
          94.6% {
            opacity: 1;
            transform: scale(1.1);
          }
          95.1% {
            opacity: 0.7;
            transform: scale(0.9);
          }
          95.6% {
            opacity: 0.3;
            transform: scale(0.6);
          }
          96.1% {
            opacity: 0;
            transform: scale(0.4);
          }
        }

        @keyframes premiumShimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        @keyframes subtleFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-1px);
          }
        }

        @keyframes premiumPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.3);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(255, 215, 0, 0);
          }
        }

        @keyframes borderGlow {
          0%,
          100% {
            box-shadow:
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.05),
              inset 0 1px 0 rgba(255, 255, 255, 0.1),
              0 0 0 2px rgba(0, 0, 0, 0.08),
              0 0 0 3px rgba(255, 255, 255, 0.6),
              0 0 0 4px rgba(0, 0, 0, 0.12),
              0 0 20px rgba(255, 255, 255, 0.2);
          }
          50% {
            box-shadow:
              0 25px 50px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              0 0 0 2px rgba(0, 0, 0, 0.12),
              0 0 0 3px rgba(255, 255, 255, 0.8),
              0 0 0 4px rgba(0, 0, 0, 0.16),
              0 0 30px rgba(255, 255, 255, 0.4);
          }
        }

        @keyframes volumetricDepth {
          0%,
          100% {
            transform: perspective(1000px) rotateX(2deg) rotateY(-1deg) translateZ(0px);
            box-shadow:
              0 35px 70px -12px rgba(0, 0, 0, 0.4),
              0 20px 40px -12px rgba(0, 0, 0, 0.3),
              0 10px 20px -12px rgba(0, 0, 0, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.1),
              inset 0 2px 0 rgba(255, 255, 255, 0.2),
              inset 0 -2px 0 rgba(0, 0, 0, 0.1),
              0 0 0 2px rgba(0, 0, 0, 0.12),
              0 0 0 3px rgba(255, 255, 255, 0.8),
              0 0 0 4px rgba(0, 0, 0, 0.16);
          }
          33% {
            transform: perspective(1000px) rotateX(1deg) rotateY(1deg) translateZ(5px);
            box-shadow:
              0 40px 80px -12px rgba(0, 0, 0, 0.45),
              0 25px 50px -12px rgba(0, 0, 0, 0.35),
              0 15px 30px -12px rgba(0, 0, 0, 0.25),
              0 0 0 1px rgba(255, 255, 255, 0.15),
              inset 0 3px 0 rgba(255, 255, 255, 0.25),
              inset 0 -3px 0 rgba(0, 0, 0, 0.15),
              0 0 0 2px rgba(0, 0, 0, 0.16),
              0 0 0 3px rgba(255, 255, 255, 0.9),
              0 0 0 4px rgba(0, 0, 0, 0.2);
          }
          66% {
            transform: perspective(1000px) rotateX(-1deg) rotateY(-2deg) translateZ(3px);
            box-shadow:
              0 30px 60px -12px rgba(0, 0, 0, 0.35),
              0 18px 36px -12px rgba(0, 0, 0, 0.25),
              0 8px 16px -12px rgba(0, 0, 0, 0.15),
              0 0 0 1px rgba(255, 255, 255, 0.08),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              inset 0 -1px 0 rgba(0, 0, 0, 0.08),
              0 0 0 2px rgba(0, 0, 0, 0.1),
              0 0 0 3px rgba(255, 255, 255, 0.7),
              0 0 0 4px rgba(0, 0, 0, 0.14);
          }
        }

        @keyframes volumetricFloat {
          0%,
          100% {
            transform: perspective(1000px) rotateX(1deg) rotateY(-0.5deg) translateY(0px)
              translateZ(0px);
          }
          50% {
            transform: perspective(1000px) rotateX(-0.5deg) rotateY(1deg) translateY(-3px)
              translateZ(8px);
          }
        }
      `}</style>
      <div
        className="bg-white rounded-3xl overflow-hidden relative transition-all duration-300 hover:scale-105 hover:-translate-y-2"
        style={{
          boxShadow: `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 2px rgba(0, 0, 0, 0.08),
            0 0 0 3px rgba(255, 255, 255, 0.6),
            0 0 0 4px rgba(0, 0, 0, 0.12)
          `,
          border: "none",
          backdropFilter: "blur(10px)",
          background: "rgba(255, 255, 255, 0.95)",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          animation:
            "volumetricDepth 12s infinite ease-in-out, volumetricFloat 8s infinite ease-in-out",
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform =
            "perspective(1000px) rotateX(3deg) rotateY(2deg) translateY(-8px) translateZ(15px)";
          e.currentTarget.style.boxShadow = `
            0 50px 100px -12px rgba(0, 0, 0, 0.5),
            0 30px 60px -12px rgba(0, 0, 0, 0.4),
            0 15px 30px -12px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.2),
            inset 0 3px 0 rgba(255, 255, 255, 0.3),
            inset 0 -3px 0 rgba(0, 0, 0, 0.2),
            0 0 0 2px rgba(0, 0, 0, 0.15),
            0 0 0 3px rgba(255, 255, 255, 0.9),
            0 0 0 4px rgba(0, 0, 0, 0.2),
            0 0 60px rgba(0, 0, 0, 0.25)
          `;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "";
          e.currentTarget.style.boxShadow = `
            0 25px 50px -12px rgba(0, 0, 0, 0.25),
            0 0 0 1px rgba(255, 255, 255, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 2px rgba(0, 0, 0, 0.08),
            0 0 0 3px rgba(255, 255, 255, 0.6),
            0 0 0 4px rgba(0, 0, 0, 0.12)
          `;
        }}
      >
        {/* Premium 3D Corner Accents */}
        <div
          className="absolute top-0 right-0 w-16 h-16 overflow-hidden pointer-events-none"
          style={{ perspective: "500px" }}
        >
          <div
            className="absolute -top-2 -right-2 w-8 h-8"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 215, 0, 0.4) 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 215, 0, 0.2) 60%, transparent 100%)",
              transform: "rotate(45deg) translateZ(10px) rotateX(15deg) rotateY(-15deg)",
              boxShadow: "0 0 15px rgba(255, 215, 0, 0.3), 0 5px 15px rgba(0, 0, 0, 0.2)",
              transformStyle: "preserve-3d",
            }}
          />
        </div>
        <div
          className="absolute bottom-0 left-0 w-12 h-12 overflow-hidden pointer-events-none"
          style={{ perspective: "500px" }}
        >
          <div
            className="absolute -bottom-1 -left-1 w-6 h-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 255, 255, 0.7) 30%, rgba(255, 215, 0, 0.15) 60%, transparent 100%)",
              transform: "rotate(45deg) translateZ(8px) rotateX(-10deg) rotateY(10deg)",
              boxShadow: "0 0 12px rgba(255, 215, 0, 0.25), 0 3px 10px rgba(0, 0, 0, 0.15)",
              transformStyle: "preserve-3d",
            }}
          />
        </div>

        {/* Additional 3D Depth Elements */}
        <div
          className="absolute top-0 left-0 w-8 h-8 overflow-hidden pointer-events-none"
          style={{ perspective: "300px" }}
        >
          <div
            className="absolute top-2 left-2 w-4 h-4"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 215, 0, 0.2) 50%, transparent 100%)",
              transform: "rotate(45deg) translateZ(5px) rotateX(20deg)",
              boxShadow: "0 0 8px rgba(255, 255, 255, 0.4)",
              transformStyle: "preserve-3d",
            }}
          />
        </div>
        <div
          className="absolute bottom-0 right-0 w-10 h-10 overflow-hidden pointer-events-none"
          style={{ perspective: "300px" }}
        >
          <div
            className="absolute bottom-2 right-2 w-3 h-3"
            style={{
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, rgba(255, 215, 0, 0.15) 50%, transparent 100%)",
              transform: "rotate(45deg) translateZ(3px) rotateX(-15deg)",
              boxShadow: "0 0 6px rgba(255, 255, 255, 0.3)",
              transformStyle: "preserve-3d",
            }}
          />
        </div>

        {/* Enhanced Gold Header with Premium Depth */}
        <div
          className="p-6 relative overflow-hidden"
          style={{
            background: `
              linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%),
              radial-gradient(ellipse at 20% 20%, rgba(255, 255, 255, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(0, 0, 0, 0.1) 0%, transparent 50%),
              linear-gradient(135deg, #A68523 0%, #B8942A 20%, #CCA735 40%, #DDB83B 60%, #CCA735 80%, #B8942A 100%)
            `,
            backgroundSize: "200% 100%, 100% 100%, 100% 100%, 100% 100%",
            boxShadow: `
              0 8px 32px rgba(155, 122, 31, 0.8),
              0 4px 16px rgba(155, 122, 31, 0.7),
              0 2px 8px rgba(0, 0, 0, 0.5),
              inset 0 3px 0 rgba(255, 255, 255, 0.8),
              inset 0 -3px 0 rgba(0, 0, 0, 0.6),
              inset 2px 0 0 rgba(255, 255, 255, 0.3),
              inset -2px 0 0 rgba(0, 0, 0, 0.2),
              0 0 25px rgba(255, 255, 255, 0.3)
            `,
            animation:
              "premiumShimmer 3s infinite ease-in-out, premiumPulse 4s infinite ease-in-out",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderTop: "2px solid rgba(255, 255, 255, 0.4)",
            borderBottom: "2px solid rgba(0, 0, 0, 0.3)",
          }}
        >
          {/* Primary Continuous Shine */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.2) 70%, transparent 100%)",
              animation: "continuousShine 4.2s infinite linear",
            }}
          />

          {/* Secondary Overlapping Shine */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0.15) 75%, transparent 100%)",
              animation: "continuousShine2 5.8s infinite linear",
            }}
          />

          {/* Primary Metal Glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.12) 40%, transparent 70%)",
              animation: "metalGlow 7.3s infinite ease-in-out",
            }}
          />

          {/* Secondary Overlapping Glow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 30% 70%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 35%, transparent 65%)",
              animation: "metalGlow2 5.1s infinite ease-in-out",
            }}
          />

          {/* Primary Flow Effect */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(45deg, transparent 35%, rgba(255,255,255,0.18) 50%, transparent 65%)",
              animation: "subtleFlow 6.7s infinite linear",
            }}
          />

          {/* Secondary Overlapping Flow */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(-35deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%)",
              animation: "subtleFlow2 4.9s infinite linear",
            }}
          />

          {/* Constant Soft Top Highlight */}
          <div
            className="absolute top-0 left-0 right-0 h-1/3"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 50%, transparent 100%)",
            }}
          />

          {/* Additional Ambient Layer */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at 70% 20%, rgba(255,255,255,0.1) 0%, transparent 60%)",
              animation: "metalGlow 8.5s infinite ease-in-out",
            }}
          />

          {/* Beautiful 4-Pointed Twinkling Stars */}
          <div
            className="absolute"
            style={{
              top: "10%",
              left: "8%",
              width: "16px",
              height: "16px",
              animation: "twinkle1 30s infinite ease-in-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "2px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
                top: "50%",
                left: "0",
                transform: "translateY(-50%)",
                boxShadow: "0 0 6px rgba(255,255,255,0.6)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "2px",
                height: "100%",
                background:
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.9), transparent)",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 6px rgba(255,255,255,0.6)",
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              top: "18%",
              right: "12%",
              width: "12px",
              height: "12px",
              animation: "twinkle2 30s infinite ease-in-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "1.5px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                top: "50%",
                left: "0",
                transform: "translateY(-50%)",
                boxShadow: "0 0 4px rgba(255,255,255,0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "1.5px",
                height: "100%",
                background:
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.8), transparent)",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 4px rgba(255,255,255,0.5)",
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              top: "45%",
              left: "5%",
              width: "20px",
              height: "20px",
              animation: "twinkle3 30s infinite ease-in-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "2.5px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                top: "50%",
                left: "0",
                transform: "translateY(-50%)",
                boxShadow: "0 0 8px rgba(255,255,255,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "2.5px",
                height: "100%",
                background:
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.7), transparent)",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 8px rgba(255,255,255,0.4)",
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              bottom: "15%",
              right: "8%",
              width: "14px",
              height: "14px",
              animation: "twinkle4 30s infinite ease-in-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "1.8px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
                top: "50%",
                left: "0",
                transform: "translateY(-50%)",
                boxShadow: "0 0 5px rgba(255,255,255,0.6)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "1.8px",
                height: "100%",
                background:
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.9), transparent)",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 5px rgba(255,255,255,0.6)",
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              bottom: "8%",
              left: "25%",
              width: "18px",
              height: "18px",
              animation: "twinkle5 30s infinite ease-in-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "2.2px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
                top: "50%",
                left: "0",
                transform: "translateY(-50%)",
                boxShadow: "0 0 7px rgba(255,255,255,0.5)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "2.2px",
                height: "100%",
                background:
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.8), transparent)",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 7px rgba(255,255,255,0.5)",
              }}
            />
          </div>

          <div
            className="absolute"
            style={{
              top: "28%",
              right: "35%",
              width: "13px",
              height: "13px",
              animation: "twinkle6 30s infinite ease-in-out",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: "100%",
                height: "1.6px",
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)",
                top: "50%",
                left: "0",
                transform: "translateY(-50%)",
                boxShadow: "0 0 5px rgba(255,255,255,0.4)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "1.6px",
                height: "100%",
                background:
                  "linear-gradient(180deg, transparent, rgba(255,255,255,0.7), transparent)",
                top: "0",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: "0 0 5px rgba(255,255,255,0.4)",
              }}
            />
          </div>

          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">
              Book Your Equipment
            </h3>
            <p className="text-white/90 text-sm drop-shadow-md">
              Check availability and get instant quotes
            </p>
          </div>
        </div>

        {/* Enhanced 3D Form Content with Volumetric Depth */}
        <div
          className="p-6 space-y-6 relative"
          style={{
            background: `
                  radial-gradient(ellipse at 10% 10%, rgba(255, 255, 255, 0.12) 0%, transparent 40%),
                  radial-gradient(ellipse at 90% 90%, rgba(0, 0, 0, 0.04) 0%, transparent 40%),
                  linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)
                `,
            boxShadow: `
                  inset 0 3px 6px rgba(0, 0, 0, 0.06),
                  inset 0 -2px 0 rgba(255, 255, 255, 0.8),
                  inset 3px 0 0 rgba(255, 255, 255, 0.4),
                  inset -3px 0 0 rgba(0, 0, 0, 0.08),
                  0 2px 8px rgba(0, 0, 0, 0.1),
                  0 1px 3px rgba(0, 0, 0, 0.05)
                `,
            borderTop: "2px solid rgba(255, 255, 255, 0.4)",
            borderBottom: "2px solid rgba(0, 0, 0, 0.08)",
            transform: "translateZ(2px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Equipment Selection */}
          <div>
            <label htmlFor="equipment" className="block text-sm font-semibold text-gray-700 mb-2">
              Equipment Type
            </label>
            <select
              id="equipment"
              value={equipment}
              onChange={e => setEquipment(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-transparent focus:ring-0 transition-all duration-150"
              style={{
                background: `
                  radial-gradient(ellipse at 5% 5%, rgba(255, 255, 255, 0.9) 0%, transparent 30%),
                  linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)
                `,
                boxShadow: `
                  inset 0 1px 3px rgba(0, 0, 0, 0.06),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                  inset 1px 0 0 rgba(255, 255, 255, 0.4),
                  inset -1px 0 0 rgba(0, 0, 0, 0.03),
                  0 1px 2px rgba(0, 0, 0, 0.04)
                `,
                border: "2px solid rgba(229, 231, 235, 0.8)",
              }}
              onFocus={e => {
                e.target.style.boxShadow = `
                  inset 0 1px 3px rgba(0, 0, 0, 0.06),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                  inset 1px 0 0 rgba(255, 255, 255, 0.4),
                  inset -1px 0 0 rgba(0, 0, 0, 0.03),
                  0 1px 2px rgba(0, 0, 0, 0.04),
                  0 0 0 4px rgba(255, 251, 235, 0.8),
                  0 0 20px rgba(255, 251, 235, 0.6),
                  0 0 40px rgba(255, 248, 220, 0.4),
                  0 0 60px rgba(255, 245, 205, 0.3)
                `;
                e.target.style.border = "2px solid rgba(254, 240, 138, 0.8)";
              }}
              onBlur={e => {
                e.target.style.boxShadow = `
                  inset 0 1px 3px rgba(0, 0, 0, 0.06),
                  inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                  inset 1px 0 0 rgba(255, 255, 255, 0.4),
                  inset -1px 0 0 rgba(0, 0, 0, 0.03),
                  0 1px 2px rgba(0, 0, 0, 0.04)
                `;
                e.target.style.border = "2px solid rgba(229, 231, 235, 0.8)";
              }}
            >
              <option value="kubota-svl75">Kubota SVL-75 Compact Track Loader</option>
            </select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-transparent focus:ring-0 transition-all duration-150"
                style={{
                  background: `
                    radial-gradient(ellipse at 5% 5%, rgba(255, 255, 255, 0.9) 0%, transparent 30%),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)
                  `,
                  boxShadow: `
                    inset 0 1px 3px rgba(0, 0, 0, 0.06),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                    inset 1px 0 0 rgba(255, 255, 255, 0.4),
                    inset -1px 0 0 rgba(0, 0, 0, 0.03),
                    0 1px 2px rgba(0, 0, 0, 0.04)
                  `,
                  border: "2px solid rgba(229, 231, 235, 0.8)",
                }}
                onFocus={e => {
                  e.target.style.transition = "all 0.1s ease-out";
                  e.target.style.boxShadow = `
                    inset 0 1px 3px rgba(0, 0, 0, 0.06),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                    inset 1px 0 0 rgba(255, 255, 255, 0.4),
                    inset -1px 0 0 rgba(0, 0, 0, 0.03),
                    0 1px 2px rgba(0, 0, 0, 0.04),
                    0 0 0 4px rgba(255, 251, 235, 0.9),
                    0 0 20px rgba(255, 251, 235, 0.7),
                    0 0 40px rgba(255, 248, 220, 0.5),
                    0 0 60px rgba(255, 245, 205, 0.4)
                  `;
                  e.target.style.border = "2px solid rgba(229, 231, 235, 0.8)";
                }}
                onBlur={e => {
                  e.target.style.transition = "all 0.1s ease-out";
                  e.target.style.boxShadow = `
                    inset 0 1px 3px rgba(0, 0, 0, 0.06),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                    inset 1px 0 0 rgba(255, 255, 255, 0.4),
                    inset -1px 0 0 rgba(0, 0, 0, 0.03),
                    0 1px 2px rgba(0, 0, 0, 0.04)
                  `;
                  e.target.style.border = "2px solid rgba(229, 231, 235, 0.8)";
                }}
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-transparent focus:ring-0 transition-all duration-150"
                style={{
                  background: `
                    radial-gradient(ellipse at 5% 5%, rgba(255, 255, 255, 0.9) 0%, transparent 30%),
                    linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)
                  `,
                  boxShadow: `
                    inset 0 1px 3px rgba(0, 0, 0, 0.06),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                    inset 1px 0 0 rgba(255, 255, 255, 0.4),
                    inset -1px 0 0 rgba(0, 0, 0, 0.03),
                    0 1px 2px rgba(0, 0, 0, 0.04)
                  `,
                  border: "2px solid rgba(229, 231, 235, 0.8)",
                }}
                onFocus={e => {
                  e.target.style.transition = "all 0.1s ease-out";
                  e.target.style.boxShadow = `
                    inset 0 1px 3px rgba(0, 0, 0, 0.06),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                    inset 1px 0 0 rgba(255, 255, 255, 0.4),
                    inset -1px 0 0 rgba(0, 0, 0, 0.03),
                    0 1px 2px rgba(0, 0, 0, 0.04),
                    0 0 0 4px rgba(255, 251, 235, 0.9),
                    0 0 20px rgba(255, 251, 235, 0.7),
                    0 0 40px rgba(255, 248, 220, 0.5),
                    0 0 60px rgba(255, 245, 205, 0.4)
                  `;
                  e.target.style.border = "2px solid rgba(229, 231, 235, 0.8)";
                }}
                onBlur={e => {
                  e.target.style.transition = "all 0.1s ease-out";
                  e.target.style.boxShadow = `
                    inset 0 1px 3px rgba(0, 0, 0, 0.06),
                    inset 0 -1px 0 rgba(255, 255, 255, 0.8),
                    inset 1px 0 0 rgba(255, 255, 255, 0.4),
                    inset -1px 0 0 rgba(0, 0, 0, 0.03),
                    0 1px 2px rgba(0, 0, 0, 0.04)
                  `;
                  e.target.style.border = "2px solid rgba(229, 231, 235, 0.8)";
                }}
              />
            </div>
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
            <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-semibold text-green-700">
              Available Now - Book Today!
            </span>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleCheckAvailability}
            disabled={!isFormValid}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
              isFormValid
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                : "bg-gray-300 cursor-not-allowed"
            }`}
            style={{
              background: isFormValid
                ? "linear-gradient(135deg, #2563EB 0%, #1D4ED8 50%, #1E40AF 100%)"
                : undefined,
            }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Check Availability & Get Quote
          </button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Instant Confirmation</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">Secure Booking</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
