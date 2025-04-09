import { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface Item {
  name: string;
  price: string;
  quantity: string;
}

interface InvoiceConfig {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  customerName: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  discount: string;
  vat: string;
  items: Item[];
  thankYouMessage?: string;
  logoBase?: string;
}

interface InvoiceGeneratorProps {
  config?: InvoiceConfig;
}

const InvoiceGenerator = ({ config }: InvoiceGeneratorProps) => {
  const calculateSubtotal = () => {
    if (!config || !config.items) return 0;
    return config.items.reduce(
      (sum, item) =>
        sum + parseFloat(item.price || "0") * parseInt(item.quantity || "1"),
      0
    );
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const discountAmount = config
      ? (subtotal * parseFloat(config.discount || "0")) / 100
      : 0;
    const vatAmount = config
      ? ((subtotal - discountAmount) * parseFloat(config.vat || "0")) / 100
      : 0;
    return subtotal - discountAmount + vatAmount;
  };

  const formatCurrency = (amount: number) => {
    return `NGN ${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const generatePDF = () => {
    if (!config) {
      alert("No receipt configuration provided!");
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 10;
    const logoHeight = 10;
    const logoX = (pageWidth - logoWidth) / 2;
    const logoY = 10;

    if (config.logoBase) {
      try {
        const imgFormat = config.logoBase.startsWith("data:image/jpeg")
          ? "JPEG"
          : "PNG";
        doc.addImage(
          config.logoBase,
          imgFormat,
          logoX,
          logoY,
          logoWidth,
          logoHeight
        );
      } catch (error) {
        console.warn("Failed to render logo image:", error);
      }
    }

    const headerY = config.logoBase ? logoY + logoHeight + 10 : 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text("INVOICE", 160, headerY);
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const companyStartY = headerY + 10;
    doc.text(config.companyName, 20, companyStartY);
    if (config.companyAddress)
      doc.text(config.companyAddress, 20, companyStartY + 10);
    if (config.companyPhone)
      doc.text(config.companyPhone, 20, companyStartY + 20);

    const lineY = companyStartY + 30;
    doc.line(20, lineY, 190, lineY);

    doc.setFont("helvetica", "bold");
    const detailsStartY = lineY + 10;
    doc.text("RECEIVED FROM", 20, detailsStartY);
    doc.text("RECEIPT DATE", 100, detailsStartY);
    doc.text("RECEIPT NO", 160, detailsStartY);

    doc.setFont("helvetica", "normal");
    doc.text(config.customerName, 20, detailsStartY + 10);
    if (config.customerAddress)
      doc.text(config.customerAddress, 20, detailsStartY + 20);
    doc.text(config.invoiceDate, 100, detailsStartY + 10);
    doc.text(config.invoiceNumber, 160, detailsStartY + 10);

    const tableColumn = [
      "#",
      "Item(s) and Description",
      "Qty",
      "Rate",
      "Amount",
    ];
    const tableRows = config.items.map((item, index) => [
      (index + 1).toString(),
      item.name,
      item.quantity,
      formatCurrency(parseFloat(item.price || "0")),
      formatCurrency(
        parseFloat(item.price || "0") * parseInt(item.quantity || "1")
      ),
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: detailsStartY + 30,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 5 },
      headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
    });

    let yPosition = (doc as any).lastAutoTable.finalY + 10;

    const subtotal = calculateSubtotal();
    const discountAmount =
      (subtotal * parseFloat(config.discount || "0")) / 100;
    const vatAmount =
      ((subtotal - discountAmount) * parseFloat(config.vat || "0")) / 100;
    const total = calculateTotal();

    const rowSpacing = 8;
    const labelX = 110;
    const amountX = 200;

    doc.text("Sub-total:", labelX, yPosition);
    doc.text(formatCurrency(subtotal), amountX, yPosition, { align: "right" });

    yPosition += rowSpacing;
    doc.text(`Discount (${config.discount || "0"}%):`, labelX, yPosition);
    doc.text(`-${formatCurrency(discountAmount)}`, amountX, yPosition, {
      align: "right",
    });

    yPosition += rowSpacing;
    doc.text(`VAT (${config.vat || "0"}%):`, labelX, yPosition);
    doc.text(formatCurrency(vatAmount), amountX, yPosition, { align: "right" });

    yPosition += rowSpacing + 5;
    doc.setFont("helvetica", "bold");
    doc.setFillColor(230, 230, 230);
    doc.rect(labelX, yPosition - 5, 90, 10, "F");
    doc.text("Total Paid [NGN]:", labelX, yPosition);
    doc.text(formatCurrency(total), amountX, yPosition, { align: "right" });

    doc.setFontSize(10);
    doc.text(
      config.thankYouMessage ||
        `Thank you for choosing ${config.companyName || "us"}`,
      20,
      doc.internal.pageSize.height - 30
    );
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 102, 204);
    doc.text("Powered by e/emie", 20, doc.internal.pageSize.height - 20);

    doc.save(`Receipt_${config.customerName}.pdf`);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl mb-4 font-bold">Receipt Generator</h2>
      <button
        onClick={generatePDF}
        className="p-2 bg-blue-500 text-white rounded-[20px] w-full"
        disabled={!config}
      >
        Download Receipt
      </button>
    </div>
  );
};

const ReceiptForm = () => {
  const [companyName, setCompanyName] = useState<string>("");
  const [companyAddress, setCompanyAddress] = useState<string>("");
  const [companyPhone, setCompanyPhone] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [customerAddress, setCustomerAddress] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [discount, setDiscount] = useState<string>("");
  const [vat, setVat] = useState<string>("");
  const [items, setItems] = useState<Item[]>([
    { name: "", price: "", quantity: "" },
  ]);
  const [thankYouMessage, setThankYouMessage] = useState<string>("");
  const [logoBase, setLogoBase] = useState<string>("");

  const addItem = () => {
    setItems([...items, { name: "", price: "", quantity: "" }]);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    setItems(updatedItems);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoBase(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const config: InvoiceConfig = {
    companyName,
    companyAddress,
    companyPhone,
    customerName,
    customerAddress,
    invoiceNumber,
    invoiceDate,
    discount,
    vat,
    items,
    thankYouMessage,
    logoBase,
    dueDate: "",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-purple-100 py-5 px-2 sm:px-4 lg:px-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-2xl p-6 md:p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text">
          Create Invoice
        </h2>

        <div className="space-y-2 mb-3">
          <h3 className="text-lg font-semibold text-gray-700">
            Company Details
          </h3>
          <input
            type="text"
            placeholder="Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-[60%] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
          <input
            type="text"
            placeholder="Company Address"
            value={companyAddress}
            onChange={(e) => setCompanyAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
          <input
            type="text"
            placeholder="Company Phone"
            value={companyPhone}
            onChange={(e) => setCompanyPhone(e.target.value)}
            className="w-[60%] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
        </div>

        <div className="space-y-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Customer Details
          </h3>
          <input
            type="text"
            placeholder="Customer Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-[60%] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
          <input
            type="text"
            placeholder="Customer Address"
            value={customerAddress}
            onChange={(e) => setCustomerAddress(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
        </div>

        <div className="space-y-3 m-5 mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Receipt Details
          </h3>
          <input
            type="text"
            placeholder="Receipt Number"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-[30%] mr-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-[30%] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
        </div>

        <div className="space-y-2 m-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-700">
            Financial Details
          </h3>
          <input
            type="number"
            placeholder="Discount (%)"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            className="w-[30%] mr-10 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
          <input
            type="number"
            placeholder="VAT (%)"
            value={vat}
            onChange={(e) => setVat(e.target.value)}
            className="w-[30%] px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-700">Items</h3>
          {items.map((item, index) => (
            <div key={index} className="flex space-x-3">
              <input
                type="text"
                placeholder="Item Name"
                value={item.name}
                onChange={(e) => updateItem(index, "name", e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.price}
                onChange={(e) => updateItem(index, "price", e.target.value)}
                className="w-28 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              />
              <input
                type="number"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                className="w-20 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
              />
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            Add Another Item
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-700">
            Additional Details
          </h3>
          <input
            type="text"
            placeholder="Thank You Message (optional)"
            value={thankYouMessage}
            onChange={(e) => setThankYouMessage(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200"
          />
          <div className="relative">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        <InvoiceGenerator config={config} />
      </div>
    </div>
  );
};

export default ReceiptForm;
