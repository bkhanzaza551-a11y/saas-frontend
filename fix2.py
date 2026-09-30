import re

with open('src/pages/owner/EnquiriesPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Let's just find       <style>{`...`}</style> block and replace the whole thing properly.
# The </style> is unique.
# Let's find the position of </style> and replace the last few lines.
start = content.rfind('          .modal-content {')
end = content.find('</style>')

new_css = '''          .modal-content {
            padding: 18px 14px !important;
            max-height: 90vh !important;
            overflow-y: auto !important;
          }
        }
        @media (max-width: 900px) {
          .eq-detail-grid { grid-template-columns: 1fr !important; }
        }
      }
      '''

content = content[:start] + new_css + content[end:]

with open('src/pages/owner/EnquiriesPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
