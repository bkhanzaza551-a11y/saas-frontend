import re

with open('src/pages/owner/EnquiriesPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("      }\n        @media (max-width: 900px) {\n          .eq-detail-grid { grid-template-columns: 1fr !important; }\n        }\n\n      </style>", "        @media (max-width: 900px) {\n          .eq-detail-grid { grid-template-columns: 1fr !important; }\n        }\n      }\n      </style>")

with open('src/pages/owner/EnquiriesPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
