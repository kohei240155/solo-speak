import Image from "next/image";

interface SplashScreenProps {
  showSplash: boolean;
  fadeOut: boolean;
}

export default function SplashScreen({
  showSplash,
  fadeOut,
}: SplashScreenProps) {
  if (!showSplash) return null;

  return (
    <div
      className={`fixed inset-0 bg-white flex items-center justify-center transition-opacity duration-500 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
      style={{ zIndex: 9999 }}
    >
      <Image
        src="/images/logo/Solo Speak Logo.png"
        alt="Solo Speak"
        width={300}
        height={100}
        priority
        className={`transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
      />
    </div>
  );
}
