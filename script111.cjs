const fs = require('fs');
const file = 'src/pages/owner/ReportsHubPage.jsx';
let content = fs.readFileSync(file, 'utf8');

// Add activeGroup state
content = content.replace('const [activeReport, setActiveReport] = useState("sales_summary");', 'const [activeGroup, setActiveGroup] = useState("Sales & Revenue");\n  const [activeReport, setActiveReport] = useState("sales_summary");');

// Add useEffect to sync activeGroup and activeReport
const useEffectSync = `
  useEffect(() => {
    const reportsInGroup = ALL_REPORTS.filter(r => r.group === activeGroup);
    if (reportsInGroup.length > 0 && !reportsInGroup.some(r => r.key === activeReport)) {
      setActiveReport(reportsInGroup[0].key);
    }
  }, [activeGroup, activeReport]);
`;
content = content.replace('const { options: filterOptions, filterConfig } = useReportOptions(activeReport);', useEffectSync + '\n  const { options: filterOptions, filterConfig } = useReportOptions(activeReport);');

fs.writeFileSync(file, content, 'utf8');
console.log("Updated State");
