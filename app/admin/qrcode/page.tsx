'use client';

import { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

export default function QRPage() {
  const link = 'https://cms-frontend-swart.vercel.app/';
  const qrRef = useRef<HTMLCanvasElement>(null);

  // Download QR as PNG
  const handleDownload = () => {
    if (!qrRef.current) return;

    const pngUrl = qrRef.current
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');

    const downloadLink = document.createElement('a');
    downloadLink.href = pngUrl;
    downloadLink.download = 'qr-code.png';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Print only QR code
  const handlePrint = () => {
    if (!qrRef.current) return;

    const dataUrl = qrRef.current.toDataURL();
    const printWindow = window.open('', '_blank', 'width=300,height=400');

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR Code</title>
        </head>
        <body style="margin:0; padding:20px; text-align:center;">
          <img src="${dataUrl}" style="width:250px; height:250px;" />
          <p style="margin-top:10px;">${link}</p>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-xl font-bold mb-6">
          Scan this QR Code to visit our website
        </h1>

        <QRCodeCanvas value={link} size={250} ref={qrRef} />

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handleDownload}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download PNG
          </button>

          <button
            onClick={handlePrint}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Print QR
          </button>
        </div>
      </div>
    </div>
  );
}
