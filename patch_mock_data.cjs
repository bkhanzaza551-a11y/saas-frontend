const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'CustomersPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

const mockHeaders = "MOBILE NO,NAME,GENDER,LAST VISITED,TOTAL ORDERS,TOTAL PURCHASE AMOUNT,AVERAGE PURCHASE AMOUNT,ONLINE VISITS,LOYALTY,REFERRAL CODE,ADVANCE,BALANCE,MEMBERSHIP COUNT,PACKAGE COUNT,BIRTH DATE\\n";

let mockRows = "";
const firstNames = ["Ali", "Sara", "John", "Aisha", "Omar", "Zainab", "Bilal", "Fatima", "Hassan", "Maryam", "Usman", "Khadija", "Tariq", "Amina", "Raza", "Sana", "Ibrahim", "Hira", "Kamran", "Nida", "Fahad", "Zoya", "Hamza", "Sadia", "Imran"];
const lastNames = ["Khan", "Ahmed", "Smith", "Ali", "Hussain", "Raza", "Malik", "Shah", "Iqbal", "Javed", "Tariq", "Qureshi", "Baig", "Sheikh", "Mirza"];

for (let i = 0; i < 25; i++) {
  const phone = "923" + Math.floor(10000000 + Math.random() * 90000000);
  const name = firstNames[i % firstNames.length] + " " + lastNames[i % lastNames.length];
  const gender = i % 3 === 0 ? "Female" : "Male";
  const lastVisited = "14-Sept-2026";
  const totalOrders = Math.floor(Math.random() * 10) + 1;
  const totalAmount = totalOrders * (Math.floor(Math.random() * 1000) + 500);
  const avgAmount = Math.floor(totalAmount / totalOrders);
  const onlineVisits = Math.floor(Math.random() * 3);
  const loyalty = Math.floor(Math.random() * 200);
  const refCode = name.split(" ")[0].toUpperCase() + Math.floor(1000 + Math.random() * 9000);
  const advance = i % 4 === 0 ? 500 : 0;
  const balance = i % 5 === 0 ? 200 : 0;
  const memCount = i % 6 === 0 ? 1 : 0;
  const pkgCount = i % 7 === 0 ? 1 : 0;
  const dob = (10 + (i%20)) + "-Aug-199" + (i%10);

  mockRows += `${phone},${name},${gender},${lastVisited},${totalOrders},${totalAmount},${avgAmount},${onlineVisits},${loyalty},${refCode},${advance},${balance},${memCount},${pkgCount},${dob}\\n`;
}

const downloadTestDataCode = `
  const downloadTestData = () => {
    setShowExportMenu(false);
    const headers = "${mockHeaders}";
    const rows = \`${mockRows}\`;
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "Customer_Test_Data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
`;

// Replace the old downloadTestData function
const regex = /const downloadTestData = \(\) => \{[\s\S]*?document\.body\.removeChild\(link\);\s*\};\s*/;
content = content.replace(regex, downloadTestDataCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched mock data successfully.');
