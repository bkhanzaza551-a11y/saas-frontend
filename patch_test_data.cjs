const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const downloadTestDataCode = `
  const downloadTestData = () => {
    setShowExportMenu(false);
    const headers = "Name,Phone,Email,Gender,DOB,Anniversary,Address,Notes\\n";
    const row1 = "John Doe,9876543210,john@example.com,M,1990-01-01,2020-05-15,123 Main St,VIP Customer\\n";
    const row2 = "Jane Smith,9876543211,jane@example.com,F,1992-02-02,,456 Oak Ave,\\n";
    const row3 = "Test User,9876543212,test@example.com,O,,,,Test notes\\n";
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + row1 + row2 + row3);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "Customer_Test_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

content = content.replace(/const handleExport = async \(format\) => \{/, downloadTestDataCode + "\n  const handleExport = async (format) => {");

content = content.replace(/<button className="export-item" onClick=\{\(\) => handleExport\("csv"\)\}>Export as CSV<\/button>/, `<button className="export-item" onClick={() => handleExport("csv")}>Export as CSV</button>\n                  <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />\n                  <button className="export-item" onClick={downloadTestData} style={{ color: '#2563eb', fontWeight: 600 }}>Download Test Data</button>`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched CustomersPage successfully.');
