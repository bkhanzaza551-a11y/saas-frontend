import re

with open('src/pages/owner/EnquiriesPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

bad = """      `}        @media (max-width: 900px) {
          .eq-detail-grid { grid-template-columns: 1fr !important; }
        }
      </style>"""

good = """        @media (max-width: 900px) {
          .eq-detail-grid { grid-template-columns: 1fr !important; }
        }
      `}
      </style>"""

content = content.replace(bad, good)

with open('src/pages/owner/EnquiriesPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
