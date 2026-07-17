import Image from "next/image";

interface PublicBrandLogoProps {
  priority?: boolean;
}

export function PublicBrandLogo({ priority = false }: PublicBrandLogoProps) {
  return (
    <Image
      alt=""
      className="publicBrandLogo"
      height={337}
      priority={priority}
      src="/brand/tiger-ping-pong-logo-black.png"
      width={1070}
    />
  );
}
