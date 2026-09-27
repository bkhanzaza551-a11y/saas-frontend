const fs = require('fs');
const file = 'src/components/PhoneVerificationModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const stored = JSON\.parse\(localStorage\.getItem\("salonnest_auth"\) \|\| "\{\}"\);\s*if \(stored\?\.user\) \{\s*stored\.user\.isPhoneVerified = false;\s*stored\.user\.phoneVerificationSkipped = true;\s*localStorage\.setItem\("salonnest_auth", JSON\.stringify\(stored\)\);\s*\}/g;

const replacement = `const updateStorageSkip = (key) => {
          let raw = localStorage.getItem(key);
          if (!raw) {
             raw = sessionStorage.getItem(key);
             if (!raw) return;
             const st = JSON.parse(raw);
             if (st?.user) { st.user.isPhoneVerified = false; st.user.phoneVerificationSkipped = true; }
             sessionStorage.setItem(key, JSON.stringify(st));
             return;
          }
          const st = JSON.parse(raw);
          if (st?.user) { st.user.isPhoneVerified = false; st.user.phoneVerificationSkipped = true; }
          localStorage.setItem(key, JSON.stringify(st));
        };
        updateStorageSkip("salonnest_auth");
        updateStorageSkip("salonnest_auth_session");`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
