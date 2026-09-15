const fs = require('fs');
const path = require('path');

const filePath = path.join('d:', 'saas_Respark', 'frontend', 'src', 'pages', 'owner', 'AttendanceManagementPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace statCards
const oldStatsRegex = /const statCards = useMemo\(\(\) => \{[\s\S]*?\}, \[summary\]\);/g;
const newStats = `const statCards = useMemo(() => {
      if (!summary) return [];
      return [
        { label: "Total Staff", value: summary.totalStaff || 0, icon: Users, color: "#6366f1", bg: "#eef2ff" },
        { label: "Present", value: summary.presentToday || 0, icon: UserCheck, color: "#10b981", bg: "#ecfdf5" },
        { label: "Absent", value: summary.absentToday || 0, icon: UserX, color: "#ef4444", bg: "#fef2f2" },
        { label: "Late", value: summary.lateStaff || 0, icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb" },
        { label: "On Leave", value: summary.onLeave || 0, icon: Calendar, color: "#ec4899", bg: "#fdf2f8" },
        { label: "Attendance %", value: (summary.attendancePercentage || 0) + "%", icon: CheckCircle2, color: "#06b6d4", bg: "#ecfeff" }
      ];
    }, [summary]);`;

content = content.replace(oldStatsRegex, newStats);

// Also change the badge colors mapping
const oldBadgeRegex = /const getStatusBadge = \(status\) => \{[\s\S]*?return \{ bg: "#f8fafc", color: "#64748b", text: status \};\s*\};/g;
const newBadge = `const getStatusBadge = (status) => {
      switch (status) {
        case "PRESENT": return { bg: "#ecfdf5", color: "#10b981", text: "Present" };
        case "LATE": return { bg: "#fffbeb", color: "#f59e0b", text: "Late" };
        case "ABSENT": return { bg: "#fef2f2", color: "#ef4444", text: "Absent" };
        case "LEAVE": return { bg: "#fdf2f8", color: "#ec4899", text: "On Leave" };
        case "CHECKED_OUT": return { bg: "#f5f3ff", color: "#8b5cf6", text: "Checked Out" };
        case "NOT_CHECKED_IN": return { bg: "#eef2ff", color: "#6366f1", text: "Not Checked In" };
        default: return { bg: "#f8fafc", color: "#64748b", text: status };
      }
    };`;

content = content.replace(oldBadgeRegex, newBadge);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Patched AttendanceManagementPage.jsx successfully.');
