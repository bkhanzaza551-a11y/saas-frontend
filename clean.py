import os
import re

file_path = "src/pages/owner/CustomersPage.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Function to remove a state declaration line
def remove_line_containing(text, target):
    lines = text.split("\n")
    lines = [line for line in lines if target not in line]
    return "\n".join(lines)

# Remove State Hooks
states_to_remove = [
    "const [showMakePartnerModal",
    "const [partnerForm",
    "const [partnerLoading",
    "const [customerAffiliateWallet",
    "const [showFamilyModal",
    "const [familyForm",
    "const [familyError",
    "const [familySearchQuery",
    "const [familySearchResults",
    "const [familySearchLoading",
    "const [selectedFamilyGuest",
    "const [showFollowUpModal",
    "const [followUpForm"
]

for s in states_to_remove:
    content = remove_line_containing(content, s)

# Remove Effects
# There's an effect: 
# if (detailTab === "affiliate") {
#       setCustomerAffiliateWallet(null);
#       api.get(`/owner/referrals/wallets/${selectedCustomer.id}`)
#         ...
#     }
content = re.sub(r'if\s*\(detailTab === "affiliate"\)\s*\{[^}]*catch[^\}]*\}[^\}]*\}', '', content)
# actually, it's safer to remove by string replacement if possible

with open("src/pages/owner/CustomersPage_cleaned.jsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Cleaned basic states")
