import { useEffect, useState } from "react";
import InvoiceGenerator from "./components/InvoiceGenerator";

const shoePurchaseConfigBase = {
  companyName: "covey's gadget",
  companyAddress: "123 Shoe Street, Lagos",
  companyPhone: "07031052930",
  customerName: "John Doe",
  customerAddress: "456 Customer Road, Abuja",
  invoiceNumber: "INV-001",
  invoiceDate: "2025-04-04",
  dueDate: "2025-04-11",
  discount: "10",
  vat: "7.5",
  items: [
    { name: "Leather Sneakers", price: "15000", quantity: "1" },
    { name: "Running Shoes", price: "12000", quantity: "1" },
    { name: "Casual Loafers", price: "18000", quantity: "1" },
  ],
  thankYouMessage: "Thank you for shopping with us!",
};

function App() {
  const [logoBase64, setLogoBase64] = useState<string | undefined>(undefined);

  useEffect(() => {
    const convertSvgToBase64 = async () => {
      try {
        const response = await fetch("/vite.svg");
        const svgText = await response.text();

        const img = new Image();
        const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width || 20;
          canvas.height = img.height || 10;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const base64 = canvas.toDataURL("image/png");
            setLogoBase64(base64);
            URL.revokeObjectURL(url);
          }
        };
        img.onerror = () => {
          console.error("Failed to load SVG");
          URL.revokeObjectURL(url);
        };
        img.src = url;
      } catch (error) {
        console.error("Error converting SVG to base64:", error);
      }
    };

    convertSvgToBase64();
  }, []);

  const configWithLogo = {
    ...shoePurchaseConfigBase,
    logoBase: logoBase64,
  };

  return (
    <>
      {logoBase64 ? (
        <InvoiceGenerator config={configWithLogo} />
      ) : (
        <p>Loading logo...</p>
      )}
    </>
  );
}

export default App;
