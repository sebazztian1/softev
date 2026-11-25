import { QRCodeSVG } from 'qrcode.react';

export function QrCodeSvg({ value, size = 144 }: { value: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      marginSize={4}
      fgColor="#0F2A66"
      role="img"
      aria-label={`Kode QR ${value}`}
    />
  );
}
