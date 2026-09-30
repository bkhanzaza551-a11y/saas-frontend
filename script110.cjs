const fs = require('fs');
const file = 'src/pages/owner/ReportsHubPage.jsx';
let content = fs.readFileSync(file, 'utf8');

const newReports = `const ALL_REPORTS = [
  // 1. Sales & Revenue
  { key: "salon_analytics", label: "Salon Analytics", group: "Sales & Revenue" },
  { key: "sales_summary", label: "Sales Summary", group: "Sales & Revenue" },
  { key: "service_sales", label: "Service Revenue", group: "Sales & Revenue" },
  { key: "product_sales", label: "Product Revenue", group: "Sales & Revenue" },
  { key: "day_wise", label: "Day Wise Report", group: "Sales & Revenue" },
  { key: "cancelled_invoices", label: "Cancelled Orders", group: "Sales & Revenue" },

  // 2. Staff & Incentives
  { key: "staff_performance", label: "Stylist Revenue", group: "Staff & Incentives" },

  // 3. Customers
  { key: "customers", label: "Customer Collection", group: "Customers" },
  { key: "feedback", label: "Feedback", group: "Customers" },

  // 4. Memberships & Promotions
  { key: "memberships", label: "Memberships Sold", group: "Memberships & Promotions" },
  { key: "membership_redemption", label: "Membership Redemption", group: "Memberships & Promotions" },
  { key: "packages", label: "Packages Sold", group: "Memberships & Promotions" },
  { key: "package_redemption", label: "Package Redemption", group: "Memberships & Promotions" },
  { key: "gift_card_sold", label: "Gift Card Sold", group: "Memberships & Promotions" },
  { key: "gift_card_redemption", label: "Gift Card Redemption", group: "Memberships & Promotions" },
  { key: "advance_received", label: "Advance Received", group: "Memberships & Promotions" },
  { key: "coupon_redemption", label: "Coupon Redemption", group: "Memberships & Promotions" },

  // 5. Finance & Tax
  { key: "financial_reports", label: "Financial Reports", group: "Finance & Tax" },
  { key: "pnl_report", label: "P&L Report", group: "Finance & Tax" },
  { key: "gst_returns", label: "GST Returns", group: "Finance & Tax" },

  // 6. Inventory
  { key: "daily_stock", label: "Daily Stock", group: "Inventory" },
  { key: "stock_transaction", label: "Stock Transaction", group: "Inventory" },

  // 7. Appointments & Attendance
  { key: "appointments", label: "Appointment Report", group: "Appointments & Attendance" },
  { key: "staff_attendance", label: "Staff Attendance", group: "Appointments & Attendance" }
];`;

content = content.replace(/const ALL_REPORTS = \[[^\]]*\];/, newReports);

fs.writeFileSync(file, content, 'utf8');
console.log("Updated ALL_REPORTS");
