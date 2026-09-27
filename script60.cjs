const fs = require('fs');
const file = 'src/components/PhoneVerificationModal.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const stored = JSON\.parse\(localStorage\.getItem\("salonnest_auth"\) \|\| "\{\}"\);\s*if \(stored\?\.user\) \{\s*stored\.user\.isPhoneVerified = true;\s*stored\.user\.phone = fullPhone;\s*\}\s*if \(stored\?\.membership\) \{\s*stored\.membership\.phone = fullPhone;\s*if \(stored\.membership\.salon\) stored\.membership\.salon\.phone = fullPhone;\s*\}\s*localStorage\.setItem\("salonnest_auth", JSON\.stringify\(stored\)\);/g;

const replacement = `const updateStorage = (key) => {
          let raw = localStorage.getItem(key);
          if (!raw) {
             raw = sessionStorage.getItem(key);
             if (!raw) return;
             const st = JSON.parse(raw);
             if (st?.user) { st.user.isPhoneVerified = true; st.user.phone = fullPhone; }
             if (st?.membership) { st.membership.phone = fullPhone; if (st.membership.salon) st.membership.salon.phone = fullPhone; }
             sessionStorage.setItem(key, JSON.stringify(st));
             return;
          }
          const st = JSON.parse(raw);
          if (st?.user) { st.user.isPhoneVerified = true; st.user.phone = fullPhone; }
          if (st?.membership) { st.membership.phone = fullPhone; if (st.membership.salon) st.membership.salon.phone = fullPhone; }
          localStorage.setItem(key, JSON.stringify(st));
        };
        updateStorage("salonnest_auth");
        updateStorage("salonnest_auth_session");`;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
