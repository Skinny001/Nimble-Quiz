const fs = require('fs');
const file = 'app/components/PlayView.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(`            </button>
          ))}
        </div>
        </div>`, `            </button>
          ))}
        </div>`);

fs.writeFileSync(file, code);
console.log('patched');
