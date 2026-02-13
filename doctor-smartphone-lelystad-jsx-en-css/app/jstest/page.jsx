export const metadata = {
  title: 'JavaScript Test',
}

export default function JSTest() {
  return (
    <html>
      <head>
        <title>JavaScript Test</title>
      </head>
      <body style={{ padding: '40px' }}>
        <h1>JavaScript Test</h1>
        <p id="status">JavaScript is NOT working</p>
        <button id="testBtn" style={{ padding: '10px 20px', backgroundColor: 'blue', color: 'white', border: 'none', cursor: 'pointer' }}>
          Click Me
        </button>
        <script dangerouslySetInnerHTML={{__html: `
          console.log("Script is running!");
          document.getElementById('status').textContent = 'JavaScript IS working!';
          document.getElementById('status').style.color = 'green';
          document.getElementById('testBtn').onclick = function() {
            const existing = document.getElementById('js-test-modal');
            if (!existing) {
              const overlay = document.createElement('div');
              overlay.id = 'js-test-modal';
              overlay.style.position = 'fixed';
              overlay.style.inset = '0';
              overlay.style.background = 'rgba(0,0,0,0.5)';
              overlay.style.display = 'flex';
              overlay.style.alignItems = 'center';
              overlay.style.justifyContent = 'center';
              overlay.style.zIndex = '9999';
              overlay.innerHTML = [
                '<div style="background:#fff;padding:20px;border-radius:10px;max-width:360px;width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.2)">',
                '  <h3 style="margin:0 0 8px;font-size:18px;">JavaScript werkt</h3>',
                '  <p style="margin:0 0 16px;color:#444;">Button clicked! JavaScript works!</p>',
                '  <button id="js-test-close" style="padding:8px 12px;background:#3ca0de;color:#fff;border:none;border-radius:6px;cursor:pointer;">Sluiten</button>',
                '</div>'
              ].join('\n');
              document.body.appendChild(overlay);
              document.getElementById('js-test-close').onclick = () => overlay.remove();
            }
            document.body.style.backgroundColor = 'lightgreen';
          };
        `}} />
      </body>
    </html>
  )
}
